import { Message } from "discord.js";
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
        StringContains(str: string, contains:Array<string>, wholeWord?:boolean): boolean;
        FetchLastMessages(message:Message):Promise<void>;
    }

    export interface Triggers {
        GetResponseFromString(message: string): Joebot.TriggerValue;
    }

    export interface TriggerValue {
        TriggerWords:Array<string>;
        Responses: Array<string>;
        MessageDelete?: boolean;
        SendRandomResponse?: boolean;
    }
} 