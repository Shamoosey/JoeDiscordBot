import { Client, Message} from "discord.js";
import {inject, injectable} from "inversify";
import { Commands} from "./enums"
import { CronJob } from 'cron';
import jsonHelper from "./data/jsonHelper.json"
import { Smokebot } from "./interfaces";
import { Logger } from "winston";

@injectable()
export class Bot implements Smokebot.Bot{
    private _client: Client;
    private readonly _token: string;
    private _helper: Smokebot.IHelper;
    private _logger: Logger;

    constructor(
        @inject("Client") client: Client,
        @inject("Token") token: string,
        @inject("Helper") helper: Smokebot.IHelper,
        @inject("Logger") logger: Logger,
    ) {
        this._client = client;
        this._token = token;
        this._helper = helper;
        this._logger = logger;
    }

    public async Run(): Promise<void> {
        await this._client.login(this._token)
        if(this._client.isReady) {
            await this.Initalize();
        } else {
            this._client.on("ready",  async () => {
                await this.Initalize();
            })
        }
    }

    private async Initalize():Promise<void> {
        this._client.on('messageCreate', async (message: Message) => await this.onMessage(message));

        new CronJob('30 * * * *', async () => {
            try {
                await this._helper.SetStatus(jsonHelper.status[this._helper.GetRandomNumber(0, jsonHelper.status.length - 1)])
            } catch (e) {
                this._logger.error("Error occured while setting the status", e)
            }
        }, undefined, true, "America/Winnipeg", undefined, true);

        new CronJob('0 0 */1 * * *', async () => {
            try{
                await this._helper.FilterNonValidUsers();
            } catch (e){
                this._logger.error("Error occured while checking for non-valid users", e)
            }
        }, undefined, true, "America/Winnipeg", undefined, true);

    }

    private async onMessage(message:Message): Promise<void>{
        if(!message.author.bot){
            let returnMessage: Array<string> = [];
            if(message.content.startsWith(process.env.PREFIX) && !message.author.bot){
                this._logger.info(`Incomming message "${message.content}" from ${message.author.username}`)
                let formattedMessage:string = message.content.substring(1);
                let command = formattedMessage.split(" ")[0].toLowerCase();
                let messageArgs = formattedMessage.substring(command.length + 1)

                switch(command){
                    case Commands.Status:
                        returnMessage.push(await this._helper.SetStatus(messageArgs));
                        break;
                    case Commands.Help:
                        returnMessage.push(this._helper.GetHelpMessage())
                        break;
                    case Commands.WeedBad:
                        returnMessage.push("https://cdn.discordapp.com/attachments/330851322536394752/804162447861612604/vtf0hhkas9111.png");
                        if(message.guild !== null){
                            message.delete();
                        }
                        break;
                    case Commands.Suggestion: 
                        returnMessage.push("HEY JACK! HELP ME OUT OVA HERE! https://forms.gle/tbdd7A7SyWFautpMA");
                        if(message.guild !== null){
                            message.delete();
                        }
                        break;
                    case Commands.DadJoke: 
                        returnMessage.push(await this._helper.GetDadJoke());
                        if(message.guild !== null){
                            message.delete();
                        }
                        break;
                    default: 
                        returnMessage.push(jsonHelper.helpMessages[this._helper.GetRandomNumber(0, jsonHelper.helpMessages.length - 1)].replace("${help}", `${process.env.PREFIX}help`))
                        break;
                }

            } else {
                if (this._helper.StringContains(message.content, ["jack"])) {
                    returnMessage.push("LISTEN HERE JACK!")
                    returnMessage.push("https://cdn.discordapp.com/attachments/291815726426357760/945135820506038292/Z.png")
                } else if (this._helper.StringContains(message.content, ["cornpop", "corn pop"])){
                    returnMessage.push("HE WAS A BAD DUDE!")
                    returnMessage.push("https://cdn.discordapp.com/attachments/291815726426357760/945136211167703101/skynews-joe-biden-president_5645676.png")
                } else if (this._helper.StringContains(message.content,["joe biden", "joe", "biden"])){
                    returnMessage.push("I'm Joe Biden and I approve this message.");
                    returnMessage.push("https://cdn.discordapp.com/attachments/942229872644870155/945402165365723146/Eyi1SNTXEAUvdWi.jpg");
                } else if (this._helper.StringContains(message.content, ["ice cream"])){
                    returnMessage.push("https://images-ext-2.discordapp.net/external/7e7eeeFpDTpGG03L2O1Ada724rN-2AK0vQVJW-ySa6g/https/c.tenor.com/Ed9UCyWJNRcAAAAC/joe-biden-democrat.gif");
                } else if (this._helper.StringContains(message.content, ["smell"])){
                    returnMessage.push("https://images-ext-1.discordapp.net/external/NBzRWM6bHuwA3jgLJvFp-3SlJL4s2eTElJVFZMgUv4U/https/c.tenor.com/7YE56XN5IdsAAAAC/joe-biden-vice-president.gif");
                } else if (this._helper.StringContains(message.content, ["politics"])){
                    returnMessage.push("https://tenor.com/view/shut-up-man-will-you-gif-18636332")
                } else if (this._helper.StringContains(message.content, ["whatnowson"])){
                    if(message.guild !== null){
                        await message.delete();
                    }
                    returnMessage.push("https://media.giphy.com/media/f9eYHQ8RZ4zfc4unXx/giphy.gif")
                } else if (this._helper.StringContains(message.content, ["pumpiron"])){
                    if(message.guild !== null){
                        await message.delete();
                    }
                    returnMessage.push("https://media.giphy.com/media/fJliUiYbvEIoM/giphy.gif")
                } else if (this._helper.StringContains(message.content, ["common"])){
                    if(message.guild !== null){
                        await message.delete();
                    }
                    returnMessage.push("https://media.giphy.com/media/SWoRKslHVtqEasqYCJ/giphy.gif")
                } else if (this._helper.StringContains(message.content, ["yapyap"])){
                    if(message.guild !== null){
                        await message.delete();
                    }
                    returnMessage.push("https://media.giphy.com/media/P18aB31TcT7DBpkyUh/giphy.gif")
                } else if (this._helper.StringContains(message.content, ["tommy"])){
                    if(message.guild !== null){
                        await message.delete();
                    }
                    returnMessage.push("https://cdn.discordapp.com/attachments/559247137674887168/961416570519814144/unknown.png")
                } else if (this._helper.StringContains(message.content, ["army"])){
                    returnMessage.push("https://media.discordapp.net/attachments/306275893167521792/981707089674125392/Screenshot_20220601_034136.jpg?width=697&height=702")
                } else if (this._helper.StringContains(message.content, ["baked", "high", "weed", "cooked", "roasted", "toasted", "stoner", "cannabis"])){
                    returnMessage.push("https://cdn.discordapp.com/attachments/559247137674887168/987564534103408660/unknown.png")
                }
                if (this._helper.StringContains(message.content, ["cum"], true)) {
                    returnMessage.push("https://tenor.com/bFbhT.gif");
                }

            }
            if(returnMessage.length > 0){
                this._logger.info("Sending new message with items", returnMessage)
                for(let msg of returnMessage) {
                    await message.channel.send(msg);
                }
            }
        }
    }
}

