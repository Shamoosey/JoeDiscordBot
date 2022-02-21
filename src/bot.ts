import { Client, Message} from "discord.js";
import {inject, injectable} from "inversify";
import { Commands} from "./enums"
import { CronJob } from 'cron';
import * as statuses from "./data/status.json"
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
                await this._helper.SetStatus(statuses.status[this._helper.GetRandomNumber(0, statuses.status.length - 1)])
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
        if(message.content.startsWith(process.env.PREFIX) && !message.author.bot){
            this._logger.info(`Incomming message "${message.content}" from ${message.author.username}`)
            let returnMessage: string = `Unknown command, use ${process.env.PREFIX}help`
            let formattedMessage:string = message.content.substring(1);
            let command = formattedMessage.split(" ")[0].toLowerCase();
            let messageArgs = formattedMessage.substring(command.length + 1)

            switch(command){
                case Commands.Status:
                    returnMessage = await this._helper.SetStatus(messageArgs);
                    break;
                case Commands.Help:
                    returnMessage = this._helper.GetHelpMessage();
                    break;
                case Commands.WeedBad:
                    returnMessage = "https://cdn.discordapp.com/attachments/330851322536394752/804162447861612604/vtf0hhkas9111.png";
                    message.delete();
                    break;
            }
            
            await message.channel.send(returnMessage)
        } else if (message.content.toLowerCase().split(" ").find(x => x == "jack") && !message.author.bot) {
            await message.channel.send("LISTEN HERE JACK!")
            await message.channel.send("https://cdn.discordapp.com/attachments/291815726426357760/945135820506038292/Z.png")
        } else if (message.content.toLowerCase().split(" ").find(x => x == "cornpop") && !message.author.bot){
            await message.channel.send("https://cdn.discordapp.com/attachments/291815726426357760/945136211167703101/skynews-joe-biden-president_5645676.png")
        }
    }
}

