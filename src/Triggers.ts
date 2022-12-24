import { inject, injectable } from "inversify";
import { Joebot } from "./interfaces";
import TriggerMessages from "./data/TriggersMessages.json"

@injectable()
export class Triggers implements Joebot.Triggers.TriggerService {
    private _helper: Joebot.Helper

    constructor (
        @inject("Helper") helper: Joebot.Helper
    ) {
        this._helper = helper
    }

    private readonly TriggersValues: Array<Joebot.Triggers.TriggerValue> = TriggerMessages;

    public DefaultResponses:Array<string> = [
        "I'm Joe Biden and I approve this message.",
        "https://cdn.discordapp.com/attachments/942229872644870155/945402165365723146/Eyi1SNTXEAUvdWi.jpg"
    ]

    GetResponseFromString(message: string): Joebot.Triggers.TriggerValue {
        for( const value of this.TriggersValues){
            if(this._helper.StringContains(message, value.TriggerWords, null, true)){
                return value
            }
        }
        return undefined;
    }
}