import { ActivityType, Collection, Message } from "discord.js";

export namespace Joebot{

    export interface Bot {
        Run(): Promise<void>
    }

    export interface Helper{
        SetStatus(message:Joebot.StatusMessage): Promise<string>;
        GetHelpMessage():string;
        GetDadJoke():Promise<string>;
        GetRandomNumber(min:number, max:number):number;
        FilterNonValidUsers(): Promise<void>;
        StringContains(str: string, contains:Array<string>, wholeWord?:boolean, excludeUrl?:boolean): boolean;
        GetRecentMessages(message:Message, count?: number):Promise<Collection<string, Message<boolean>>>;
        SendMessageToChannel(message:string, channelId?: string, ): Promise<string|undefined>;
        StringIsUrl(str: string): boolean;
    }

    export namespace Configuration {

        // export 

        export interface TriggerService {
            DefaultResponses:Array<string>
            CheckTriggers(message:Message): Promise<Array<string>>;
        }

        export interface TriggerValue {
            TriggerWords:Array<string>;
            Responses?: Array<string>;
            MessageDelete?: boolean;
            SendRandomResponse?: boolean;
            IgnoreCooldown?: boolean;
            ReactEmote?: Array<string>;
        }
    }

    export interface StatusMessage {
        Status: string;
        Type?: ActivityType;
    }

} 