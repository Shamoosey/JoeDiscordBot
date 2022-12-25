import { inject, injectable } from "inversify";
import { Joebot } from "./interfaces";
import TriggerMessages from "./data/TriggersMessages.json"
import { initializeApp} from 'firebase-admin/app';

import { Client, Message } from "discord.js";
import { Logger } from "winston";
import { App } from "firebase-admin/lib/app/core";

@injectable()
export class TriggerService implements Joebot.Configuration.TriggerService {
    private _helper: Joebot.Helper;
    private _client: Client;
    private _logger: Logger;
    private _firebaseApp: App;

    private _triggersValues: Array<Joebot.Configuration.TriggerValue>;



    
    public readonly DefaultResponses:Array<string> = [
        "I'm Joe Biden and I approve this message.",
        "https://cdn.discordapp.com/attachments/942229872644870155/945402165365723146/Eyi1SNTXEAUvdWi.jpg"
    ]
    
    constructor (
        @inject("Client") client: Client,
        @inject("Helper") helper: Joebot.Helper,
        @inject("Logger") logger: Logger
    ) {
        this._helper = helper
        this._client = client;
        this._logger = logger;

        this._triggersValues = TriggerMessages;

        this._firebaseApp = initializeApp({});
        
    }

    private async GetConfiguration(): Promise<any> {


    private getResponseFromString(message: string): Joebot.Configuration.TriggerValue {
        for( const value of this._triggersValues){
            if(this._helper.StringContains(message, value.TriggerWords, null, true)){
                return value
            }
        }
        return undefined;
    }

    public async CheckTriggers(message:Message): Promise<Array<string>> {
        let returnMessage = new Array<string>();
        let triggerValue = this.getResponseFromString(message.content);
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
}