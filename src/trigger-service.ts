import { inject, injectable } from "inversify";
import { Joebot } from "./interfaces";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app"
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore"
import { Client, Message } from "discord.js";
import { Logger } from "winston";
import { Symbols } from "./enums";

@injectable()
export class ConfigurationService implements Joebot.Configuration.ConfigurationService {
    private _helper: Joebot.Helper;
    private _client: Client;
    private _logger: Logger;
    private _db: FirebaseFirestore.Firestore;

    private _configurations: Array<Joebot.Configuration.AppConfig>;

    public readonly DefaultResponses:Array<string> = [
        "I'm Joe Biden and I approve this message.",
        "https://cdn.discordapp.com/attachments/942229872644870155/945402165365723146/Eyi1SNTXEAUvdWi.jpg"
    ]

    constructor (
        @inject(Symbols.Client) client: Client,
        @inject(Symbols.Helper) helper: Joebot.Helper,
        @inject(Symbols.Logger) logger: Logger
    ) {
        this._helper = helper
        this._client = client;
        this._logger = logger;
        this._configurations = new Array<Joebot.Configuration.AppConfig>();

        const serviceAccount = require('../joebot-firebase-cert.json');

        initializeApp({
            credential: cert(serviceAccount)
        });
        this._db = getFirestore();
    }

    public async InitializeAppConfigurations(): Promise<void> {
        let appConfigs = new Array<Joebot.Configuration.AppConfig>();
        const firebaseConfigs = await this._db.collection('/JoebotConfigurations').get()

        firebaseConfigs.forEach(async (item) => {
            const triggersConfigs = await this._db.collection(`/JoebotConfigurations/${item.id}/Triggers`).get();
            const statusMessagesConfigs = await this._db.collection(`/JoebotConfigurations/${item.id}/StatusMessages`).get();

            let statusMessages = new Array<Joebot.StatusMessage>();
            statusMessagesConfigs.forEach((item) => {
                statusMessages.push({
                    Status: item.data().Status,
                    Type: item.data().Type == undefined ? 0 : item.data().Type 
                })
            })

            let triggers = new Array<Joebot.Configuration.Trigger>();
            triggersConfigs.forEach((item) => {
                triggers.push({
                    TriggerWords: item.data().TriggerWords,
                    IgnoreCooldown: item.data().IgnoreCooldown,
                    MessageDelete: item.data().MessageDelete,
                    ReactEmote: item.data().ReactEmote,
                    Responses: item.data().Responses,
                    SendRandomResponse: item.data().SendRandonResponse
                })
            })

            let configurationItem: Joebot.Configuration.AppConfig = {
                GuildId: item.id,
                DefaultChannel: item.data().DefaultChannel,
                EnableKickerCache: item.data().EnableKickerCache,
                SecretUsers: item.data().SecretUsers,
                StatusMessages: statusMessages,
                Triggers: triggers
            }
            this._configurations.push(configurationItem)
        });

        this._configurations = appConfigs;
    }


    public GetConfigurationForGuild(guildId: string): Joebot.Configuration.AppConfig | undefined {
        return this._configurations.find(x => x.GuildId == guildId);
    }

    public async CheckTriggers(message:Message): Promise<Array<string>> {
        let returnMessage = new Array<string>();
        let triggerValue = this.getResponseFromString(message.guild.id, message.content);
        if(triggerValue) {
            this._logger.info(`Found trigger in message ${message.content}`, triggerValue);
            let triggerOnCooldown = false;
            let recentMessages = await this._helper.GetRecentMessages(message);
            for( const [key, value] of recentMessages){
                if(value.author.id == this._client.user.id){
                    if(triggerValue.Responses.includes(value.content)){
                        triggerOnCooldown = true;
                        break;
                    }
                }
            }
            if(triggerValue.ReactEmote && triggerValue.ReactEmote.length > 0 && !triggerValue.MessageDelete){
                let emoteString = triggerValue.ReactEmote[this._helper.GetRandomNumber(0, triggerValue.ReactEmote.length - 1)]
                const emote = this._client.emojis.cache.find(emoji => emoji.name === emoteString);
                if(emote) {
                    this._logger.info("Reacting to user message with emote", emote)
                    await message.react(emote);
                }
            }
            if(process.env.NODE_ENV == "dev"  || (triggerValue.Responses && triggerValue.Responses.length > 0 && (!triggerOnCooldown || triggerValue.IgnoreCooldown))){
                if(triggerValue.SendRandomResponse){
                    returnMessage.push(triggerValue.Responses[this._helper.GetRandomNumber(0, triggerValue.Responses.length - 1)]);
                } else {
                    returnMessage = triggerValue.Responses;
                }

                if(triggerValue.MessageDelete && message.guild !== null){
                    await message.delete();
                }
            }
        }
        return returnMessage;
    }

    private getResponseFromString(guild: string, message: string): Joebot.Configuration.Trigger {
        const config = this.GetConfigurationForGuild(guild);
        for( const value of config.Triggers){
            if(this._helper.StringContains(message, value.TriggerWords, null, true)){
                return value
            }
        }
        return undefined;
    }
}