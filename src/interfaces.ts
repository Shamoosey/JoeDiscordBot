import { Collection, Message } from "discord.js";
import { TriggerKeys } from "./enums";

export namespace Joebot{

    export interface Bot {
        Run(): Promise<void>
    }
    export interface Helper{
        SetStatus(message:string): Promise<string>;
        GetHelpMessage():string;
        GetDadJoke():Promise<string>;
        GetRandomNumber(min:number, max:number):number;
        FilterNonValidUsers(): Promise<void>;
        StringContains(str: string, contains:Array<string>, wholeWord?:boolean, excludeUrl?:boolean): boolean;
        GetRecentMessages(message:Message, count?: number):Promise<Collection<string, Message<boolean>>>;
        SendMessageToChannel(message:string, channelId?: string, ): Promise<string|undefined>;
        StringIsUrl(str: string): boolean;
    }

    export interface Triggers {
        DefaultResponses:Array<string>
        GetResponseFromString(message: string): Joebot.TriggerValue;
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