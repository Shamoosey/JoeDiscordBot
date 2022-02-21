export namespace Smokebot{

    export interface Bot {
        Run(): Promise<void>
    }
    export interface IHelper{
        SetStatus(message:string): Promise<string>;
        GetHelpMessage():string;
        GetDadJoke():Promise<string>;
        GetRandomNumber(min:number, max:number):number;
        FilterNonValidUsers(): Promise<void>;
    }
} 