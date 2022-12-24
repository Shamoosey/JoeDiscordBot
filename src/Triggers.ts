import { inject, injectable } from "inversify";
import { Joebot } from "./interfaces";

@injectable()
export class Triggers implements Joebot.Triggers.TriggerService {
    private _helper: Joebot.Helper

    constructor (
        @inject("Helper") helper: Joebot.Helper
    ) {
        this._helper = helper
    }

    private readonly _triggers: Array<Joebot.Triggers.TriggerValue> = [
        {
            TriggerWords: ["jack"],
            Responses: [
                "LISTEN HERE JACK!",
                "https://cdn.discordapp.com/attachments/291815726426357760/945135820506038292/Z.png"
            ],
            IgnoreCooldown: true,
        },
        {
            TriggerWords: ["cornpop", "corn pop"],
            Responses: [
                "HE WAS A BAD DUDE!",
                "https://cdn.discordapp.com/attachments/291815726426357760/945136211167703101/skynews-joe-biden-president_5645676.png"
            ]
        },
        {
            TriggerWords: ["joe", "joe biden", "biden"],
            Responses: [],
            ReactEmote: ["joeCD", "brandon"]
        },
        {
            TriggerWords: ["ice cream", "icecream"],
            Responses:  [
                "https://media.discordapp.net/attachments/306275893167521792/1042448732366581930/image0.gif",
                "https://images-ext-2.discordapp.net/external/7e7eeeFpDTpGG03L2O1Ada724rN-2AK0vQVJW-ySa6g/https/c.tenor.com/Ed9UCyWJNRcAAAAC/joe-biden-democrat.gif",
                "https://media.giphy.com/media/uNJj3pVSvQbd9YDwUY/giphy.gif",
                "https://media.giphy.com/media/Z8J5EHEOCDhwBdeyzB/giphy.gif",
                "https://media.giphy.com/media/ZsWHLPrzcgBg4CxfQq/giphy.gif"
            ],
            SendRandomResponse: true
        },
        {
            TriggerWords: ["smell"],
            Responses: [ 
                "https://images-ext-1.discordapp.net/external/NBzRWM6bHuwA3jgLJvFp-3SlJL4s2eTElJVFZMgUv4U/https/c.tenor.com/7YE56XN5IdsAAAAC/joe-biden-vice-president.gif" 
            ],
            IgnoreCooldown: true
        },
        {
            TriggerWords: ["politics"],
            Responses: [
                "https://tenor.com/view/shut-up-man-will-you-gif-18636332"
            ],
            IgnoreCooldown: true
        },
        {
            TriggerWords: ["whatnowson"],
            Responses: [
                "https://media.giphy.com/media/f9eYHQ8RZ4zfc4unXx/giphy.gif"
            ],
            MessageDelete: true,
            IgnoreCooldown: true
        },
        {
            TriggerWords: ["pumpiron"],
            Responses: [
                "https://media.giphy.com/media/fJliUiYbvEIoM/giphy.gif"
            ],
            IgnoreCooldown: true
        },
        {
            TriggerWords: ["yapyap"],
            Responses: [
                "https://media.giphy.com/media/P18aB31TcT7DBpkyUh/giphy.gif"
            ],
            MessageDelete: true,
            IgnoreCooldown: true
        },
        {
            TriggerWords: ["tommy"],
            Responses: [
                "https://cdn.discordapp.com/attachments/559247137674887168/961416570519814144/unknown.png"
            ],
            MessageDelete: true,
            IgnoreCooldown: true
        },{
            TriggerWords: ["army"],
            Responses : [
                "https://media.discordapp.net/attachments/306275893167521792/981707089674125392/Screenshot_20220601_034136.jpg?width=697&height=702"
            ]
        },
        {
            TriggerWords: ["baked", "high", "weed", "cooked", "roasted", "toasted", "stoner", "cannabis"],
            Responses: [
                "https://cdn.discordapp.com/attachments/559247137674887168/987564534103408660/unknown.png"
            ]
        },
        {
            TriggerWords: ["bing chilling", "bingchilling"],
            Responses: [
                "https://cdn.discordapp.com/attachments/306275893167521792/1042456167173079060/unknown.png"
            ],
            ReactEmote: ["bingchillinCD"]
        },
        {
            TriggerWords: ["america", "god", "murica"],
            Responses: [
                "https://media.giphy.com/media/oxCtqUm9PhXvA0oXnp/giphy-downsized-large.gif"
            ]
        },
        {
            TriggerWords: ["cum"],
            Responses: [
                "https://tenor.com/bFbhT.gif"
            ],
            ReactEmote: ["GachiGasm"]
        },
        {
            TriggerWords: ["lawyer"],
            Responses: [
                "https://cdn.discordapp.com/attachments/306275893167521792/1049551060773109800/DALLE_2022-12-05_23.01.09_-_Saul_Goodman_as_a_character_in_fortnite.png",
                "https://media.discordapp.net/attachments/306275893167521792/1049551235780456448/DALLE_2022-12-05_23.01.47_-_Saul_Goodman_as_a_character_in_fortnite.png?width=702&height=702",
                "https://media.discordapp.net/attachments/306275893167521792/1049551236111794206/DALLE_2022-12-05_23.01.49_-_Saul_Goodman_as_a_character_in_fortnite.png?width=702&height=702"
            ],
            SendRandomResponse: true
        },
        {
            TriggerWords: ["winnipeg"],
            Responses: [
                "https://media.discordapp.net/attachments/306275893167521792/1050455234079625286/IMG_20221201_084351_840.png?width=829&height=676"
            ]
        },
        {
            TriggerWords: ["brandon"],
            Responses: [
                "https://cdn.discordapp.com/attachments/942229872644870155/1054971360935428126/image.png"
            ],
            ReactEmote: ["brandon"]
        },
        {
            TriggerWords: ["twitter"],
            Responses: [
                "https://i.imgur.com/S3JoQbh.jpg"
            ]
        }
    ];

    public DefaultResponses:Array<string> = [
        "I'm Joe Biden and I approve this message.",
        "https://cdn.discordapp.com/attachments/942229872644870155/945402165365723146/Eyi1SNTXEAUvdWi.jpg"
    ]

    GetResponseFromString(message: string): Joebot.Triggers.TriggerValue {
        for( const value of this._triggers){
            if(this._helper.StringContains(message, value.TriggerWords, null, true)){
                return value
            }
        }
        return undefined;
    }
}