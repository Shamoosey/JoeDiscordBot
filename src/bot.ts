import { Client, Message } from "discord.js";
import {inject, injectable} from "inversify";
import { Commands, Symbols } from "./enums"
import { CronJob } from 'cron';
import HelpMessages from "./data/HelpMessages.json"
import { Joebot } from "./interfaces";
import { Logger } from "winston";
import StatusMessages from "./data/StatusMessages.json"

@injectable()
export class Bot implements Joebot.Bot{
    private _client: Client;
    private _helper: Joebot.Helper;
    private _logger: Logger;
    private _configService: Joebot.Configuration.ConfigurationService
    private _statusMessages: Array<Joebot.StatusMessage>
    private _kickCacheService: Joebot.KickCacheService;

    private readonly secretIds = [ "281971257015009283", "177939550574739456" ]

    constructor(
        @inject(Symbols.Client) client: Client,
        @inject(Symbols.Helper) helper: Joebot.Helper,
        @inject(Symbols.Logger) logger: Logger,
        @inject(Symbols.ConfigService) configService: Joebot.Configuration.ConfigurationService,
        @inject(Symbols.KickCacheService) kickCacheService: Joebot.KickCacheService
    ) {
        this._client = client;
        this._helper = helper;
        this._logger = logger; 
        this._configService = configService;
        this._kickCacheService = kickCacheService

        this._statusMessages = StatusMessages as Array<Joebot.StatusMessage>;
    }

    public async Run(): Promise<void> {
        await this._client.login(process.env.JOE_TOKEN)
        if(this._client.isReady) {
            await this.Initalize();
        } else {
            this._client.on("ready",  async () => {
                await this.Initalize();
            })
        }
    }

    private async Initalize():Promise<void> {
        this._configService.InitializeAppConfigurations();
        this._client.on('messageCreate', async (message: Message) => await this.onMessage(message));

        new CronJob('30 * * * *', async () => {
            try {
                await this._helper.SetStatus(this._statusMessages[this._helper.GetRandomNumber(0, this._statusMessages.length - 1)])
            } catch (e) {
                this._logger.error("Error occured while setting the status", e)
            }
        }, undefined, true, "America/Winnipeg", undefined, true);

        new CronJob('0 0 */1 * * *', async () => {
            try{
                await this._kickCacheService.FilterNonValidUsers();
            } catch (e){
                this._logger.error("Error occured while checking for non-valid users", e)
            }
        }, undefined, true, "America/Winnipeg", undefined, true);
    }

    private async onMessage(message:Message): Promise<void>{
        if(!message.author.bot){
            let returnMessage = new Array<string>();
            if(message.mentions.has(this._client.user.id)){
                returnMessage = this._configService.DefaultResponses;
            } else {
                if(message.content.startsWith(process.env.PREFIX)){
                    this._logger.info(`Incomming command "${message.content}" from ${message.author.username}`)
                    returnMessage = await this.checkCommands(message);
                } else {
                    returnMessage = await this._configService.CheckTriggers(message);
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

    private async checkCommands(message:Message): Promise<Array<string>> {
        let returnMessage = new Array<string>()
        let formattedMessage:string = message.content.substring(1);
        let command = formattedMessage.split(" ")[0].toLowerCase();
        let messageArgs = formattedMessage.substring(command.length + 1)

        if(this.secretIds.includes(message.author.id) && message.guild == null && command == "send"){
            let cmdArgs = messageArgs.split(";;");
            if(cmdArgs.length > 0){
                let messageToSend= cmdArgs.length == 1 ? cmdArgs[0] : cmdArgs[1];
                let channelToSend = cmdArgs.length == 2 ? cmdArgs[0].trim() : undefined;
                let result = await this._helper.SendMessageToChannel(messageToSend, channelToSend);
                if(result){
                    returnMessage.push(result);
                }
            } 
        } else {
            switch(command){
                case Commands.Status:
                    returnMessage.push(await this._helper.SetStatus({Status: messageArgs}));
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
                    break;
                case Commands.DadJoke: 
                    returnMessage.push(await this._helper.GetDadJoke());
                    if(message.guild !== null){
                        message.delete();
                    }
                    break;
                default: 
                    returnMessage.push(HelpMessages[this._helper.GetRandomNumber(0, HelpMessages.length - 1)].replace("${help}", `${process.env.PREFIX}help`))
                    break;
            }
        }


        return returnMessage;
    }
}

