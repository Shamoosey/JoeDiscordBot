import { inject, injectable } from "inversify";
import { Joebot } from "./interfaces";
import { Client, Message } from "discord.js";
import { Logger } from "winston";
import { Symbols } from "./enums";
import axios from "axios";

@injectable()
export class ConfigurationService implements Joebot.Configuration.ConfigurationService {
    private _helper: Joebot.Helper;
    private _client: Client;
    private _logger: Logger;
    private _configurations: Array<Joebot.Configuration.AppConfig>;

    private _configServerBaseUrl = "http://localhost:50501"
    private _configsEndpoint = "/Configuration/GetAll";
    private _statusesEndpoint = "/Status/GetAll";
    
    public readonly DefaultResponses:Array<string> = [
        "I'm Joe Biden and I approve this message.",
        "https://cdn.discordapp.com/attachments/942229872644870155/945402165365723146/Eyi1SNTXEAUvdWi.jpg"
    ]
    public StatusMessages = new Array<Joebot.StatusMessage>(); 

    constructor (
        @inject(Symbols.Client) client: Client,
        @inject(Symbols.Helper) helper: Joebot.Helper,
        @inject(Symbols.Logger) logger: Logger
    ) {
        this._helper = helper
        this._client = client;
        this._logger = logger;
        this._configurations = new Array<Joebot.Configuration.AppConfig>();
    }

    public async InitializeAppConfigurations(): Promise<void> {
        this._configurations = new Array<Joebot.Configuration.AppConfig>();
        try{
            let response = await axios.get<Array<Joebot.Configuration.AppConfig>>(`${this._configServerBaseUrl}${this._configsEndpoint}`);
            if(response.status == 200){
                this._configurations = response.data;
            }
        } catch (e){
            this._logger.error("Unable to get app configurations", e);
        }

        try{
            let response = await axios.get<Array<Joebot.StatusMessage>>(`${this._configServerBaseUrl}${this._statusesEndpoint}`);
            if(response.status == 200){
                this.StatusMessages = response.data;
            }
        } catch (e){
            this._logger.error("Unable to get app status messages", e);
        }
    }

    public GetAllConfigurations():Array<Joebot.Configuration.AppConfig> {
        return this._configurations;
    }

    public GetConfigurationForGuild(guildId: string): Joebot.Configuration.AppConfig | undefined {
        return this._configurations.find(x => x.serverId == guildId);
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
                        if(triggerValue.triggerResponses.includes(value.content)){
                            triggerOnCooldown = true;
                            break;
                        }
                    }
                }
                if(triggerValue.reactEmotes && triggerValue.reactEmotes.length > 0 && !triggerValue.messageDelete){
                    let emoteString = triggerValue.reactEmotes[this._helper.GetRandomNumber(0, triggerValue.reactEmotes.length - 1)]
                    const emote = this._client.emojis.cache.find(emoji => emoji.name === emoteString);
                    if(emote) {
                        this._logger.info("Reacting to user message with emote", emote)
                        await message.react(emote);
                    }
                }
                if(process.env.NODE_ENV == "dev"  || (triggerValue.triggerResponses && triggerValue.triggerResponses.length > 0 && (!triggerOnCooldown || triggerValue.ignoreCooldown))){
                    if(triggerValue.sendRandomResponse){
                        returnMessage.push(triggerValue.triggerResponses[this._helper.GetRandomNumber(0, triggerValue.triggerResponses.length - 1)]);
                    } else {
                        returnMessage = triggerValue.triggerResponses;
                    }
    
                    if(triggerValue.messageDelete && message.guild !== null){
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
            for( const value of config.triggers){
                if(this._helper.StringContains(message, value.triggerWords, null, true)){
                    return value
                }
            }
        }
        return undefined;
    }
}