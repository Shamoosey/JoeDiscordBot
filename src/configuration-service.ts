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
    public StatusMessages = new Array<Joebot.StatusMessage>(); 

    public TestMode = false;

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

    public async InitializeAppConfigurations(guilds:Array<string>): Promise<void> {
        this._configurations = new Array<Joebot.Configuration.AppConfig>();
        
        if(process.env.NODE_ENV == "dev" && this._client.user.id == process.env.TESTING_USER) {
            this.TestMode = true;
        }
        const statusMessages = await this._db.collection(`/StatusMessages`).get()

        statusMessages.forEach(async (item) => {
            this.StatusMessages.push({
                Status: item.data().Status,
                Type: item.data().Type == undefined ? 0 : item.data().Type 
            })
        })

        for(let id of guilds){
            const config = await this.getDocumentValuesAsync("JoebotConfigurations", id);
            const triggersConfigs = await this.geCollectionValuesAsync(`/JoebotConfigurations/${id}/Triggers`);

            let triggers = new Array<Joebot.Configuration.Trigger>();
            triggersConfigs.forEach(async (item) => {
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
                GuildId: id,
                DefaultChannel: config.DefaultChannel,
                KickerCacheConfig: {
                    EnableKickerCache: config.EnableKickerCache,
                    KickCacheDays: config.KickCacheDays == undefined ? 2 : config.KickCacheDays,
                    KickCacheHours: config.KickCacheHours == undefined ? 4 : config.KickCacheHours, 
                    KickedUserMessage: config.KickedUserMessage,
                    KickServerMessage: config.KickServerMessage
                },
                SecretUsers: config.SecretUsers,
                Triggers: triggers
            }
            this._configurations.push(configurationItem)
        }
    }

    public GetAllConfigurations():Array<Joebot.Configuration.AppConfig> {
        return this._configurations;
    }

    public GetConfigurationForGuild(guildId: string): Joebot.Configuration.AppConfig | undefined {
        return this._configurations.find(x => x.GuildId == guildId);
    }

    public async CheckTriggers(message:Message): Promise<Array<string>> {
        let returnMessage = new Array<string>();
        if(message.guild != undefined){
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
        }
        return returnMessage;
    }

    private getResponseFromString(guild: string, message: string): Joebot.Configuration.Trigger | undefined {
        const config = this.GetConfigurationForGuild(guild);
        if(config != undefined){
            for( const value of config.Triggers){
                if(this._helper.StringContains(message, value.TriggerWords, null, true)){
                    return value
                }
            }
        }
        return undefined;
    }

    private getDocumentValuesAsync(collectionName, docName) {
        return this._db.collection(collectionName).doc(docName).get().then(function (doc) {
            if (doc.exists) return doc.data();
            return Promise.reject("No such document");
        });
    }

    private geCollectionValuesAsync(collectionName) {
        return this._db.collection(collectionName).get().then(function (col) {
            if (!col.empty) return col.docs;
            return Promise.reject("No such collection");
        });
    }
}