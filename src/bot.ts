import { Client, Message } from "discord.js";
import {inject, injectable} from "inversify";
import { Commands, Symbols } from "./enums"
import { CronJob } from 'cron';
import HelpMessages from "./data/HelpMessages.json"
import { Joebot } from "./interfaces";
import { Logger } from "winston";

@injectable()
export class Bot implements Joebot.Bot{
    private _client: Client;
    private _helper: Joebot.Helper;
    private _logger: Logger;
    private _configService: Joebot.Configuration.ConfigurationService
    private _kickCacheService: Joebot.KickCache.KickCacheService;

    constructor(
        @inject(Symbols.Client) client: Client,
        @inject(Symbols.Helper) helper: Joebot.Helper,
        @inject(Symbols.Logger) logger: Logger,
        @inject(Symbols.ConfigService) configService: Joebot.Configuration.ConfigurationService,
        @inject(Symbols.KickCacheService) kickCacheService: Joebot.KickCache.KickCacheService
    ) {
        this._client = client;
        this._helper = helper;
        this._logger = logger; 
        this._configService = configService;
        this._kickCacheService = kickCacheService
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
        let guilds = this._client.guilds.cache.map(x => x.id);
        await this._configService.InitializeAppConfigurations(guilds);

        this._client.on('messageCreate', async (message: Message) => await this.onMessage(message));

        new CronJob('30 * * * *', async () => {
            try {
                await this._helper.SetStatus(this._configService.StatusMessages[this._helper.GetRandomNumber(0, this._configService.StatusMessages.length - 1)])
            } catch (e) {
                this._logger.error("Error occured while setting the status", e)
            }
        }, undefined, true, "America/Winnipeg", undefined, true);

        new CronJob('0 0 */1 * * *', async () => {
            try{
                let configs = this._configService.GetAllConfigurations();
                for(let configItem of configs){
                    if(configItem.KickerCacheConfig.EnableKickerCache){
                        await this._kickCacheService.FilterNonValidUsers(configItem);
                    }
                }
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
                if(message.content.startsWith(process.env.BOT_PREFIX)){
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
        let isSecret = false
        let defaultChannel = ""

        for(let config of this._configService.GetAllConfigurations()){
            if(config?.SecretUsers != undefined){
                isSecret = config.SecretUsers.find(x => x == message.author.id) != undefined;
                defaultChannel = config.DefaultChannel
                if(isSecret){
                    break;
                }
            }

        }

        if(isSecret && message.guild == null && command == "send"){
            let cmdArgs = messageArgs.split(";;");
            if(cmdArgs.length > 0){
                let messageToSend= cmdArgs.length == 1 ? cmdArgs[0] : cmdArgs[1];
                let channelToSend = cmdArgs.length == 2 ? cmdArgs[0].trim() : defaultChannel;
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
                    returnMessage.push(HelpMessages[this._helper.GetRandomNumber(0, HelpMessages.length - 1)].replace("${help}", `${process.env.BOT_PREFIX}help`))
                    break;
            }
        }

        return returnMessage;
    }
}

