import { ActivityType, Client, Collection, GuildMember, Message, TextChannel } from "discord.js";
import {inject, injectable} from "inversify";
import { Commands, Symbols } from "./enums"
import {Joebot} from "./interfaces"
import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from "winston";

@injectable()
export class Helper implements Joebot.Helper {
    private _client: Client;
    private _logger: Logger;

    private readonly urlRegex = "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})";
    
    constructor(
        @inject(Symbols.Client) client: Client,
        @inject(Symbols.Logger) logger: Logger,
    ) {
        this._client = client;
        this._logger = logger;
    }

    public async SetStatus(message:Joebot.StatusMessage):Promise<string> {
        this._logger.info("Changing bot status", message)
        let returnMsg = "CAN'T CHANGE MY STATUS IF YOU DONT TELL ME WHAT YOU WANT JACK!";

        if(message){
            if(!message.Type || message.Type == undefined){
                message.Type = ActivityType.Playing
            }
            await this._client.user.setActivity(message.Status, { type: message.Type as any, })
            returnMsg = `Status changed to: ${message}`;
        }
        return returnMsg
    }

    public GetHelpMessage(): string {
        let returnMessage: string =`Available Commands:`;
        let commands: string[] = Object.values(Commands);
        
        commands.forEach(item => {
            returnMessage += `\n${process.env.PREFIX}${item}`
        });
        
        return returnMessage;
    }

    public StringIsUrl(str: string): boolean {
        return new RegExp(this.urlRegex).test(str);
    }

    public StringContains(str: string, contains:Array<string>, wholeWord = true, excludeUrl = false): boolean {
        let match = false;
        str = str.toLowerCase();
        for(let word of contains) {
            let formattedWord = word.toLowerCase();

            if(wholeWord){
                let regexMatch = new RegExp('\\b' + formattedWord + '\\b', 'i').test(str);
                let url = this.StringIsUrl(str);
                match = match || ( excludeUrl ? regexMatch && !url : regexMatch)
            } else {
                let stringContains = str.indexOf(formattedWord) >= 0;
                let url = this.StringIsUrl(str);
                match = match || ( excludeUrl ? stringContains && !url : stringContains)
            }
        }

        return match;
    }

    public async SendMessageToChannel(message:string, channelId:string): Promise<string|undefined>{
        let returnMessage;
        try{
            const channel = this._client.channels.cache.get(channelId) as TextChannel 
            await channel.send(message)
        } catch (e){
            this._logger.error("Error occurred while sending message to channel", e);
            returnMessage = "Something went wrong, check the logs."
        }

        return returnMessage;
    } 

    public async GetDadJoke(): Promise<string> {
        let message = "I SEEMED TO HAVE FUCKED SOMETHING UP, CAN'T DO THAT RIGHT NOW";
        try{
            let config:AxiosRequestConfig = {
                headers:{
                    "Accept": "application/json",
                    "User-Agent": "https://github.com/Shamoosey"
                }
            }
            let response = await axios.get("https://icanhazdadjoke.com", config)
            if(response.status == 200){
                message = response.data.joke;
            }
        } catch (e){
            this._logger.error("Error occured while requesting data joke", e)
        }
        return message;
    }

    public GetRandomNumber(min:number, max:number):number{
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public async GetRecentMessages(message:Message, count: number = 20): Promise<Collection<string, Message<boolean>>> {
        this._logger.info(`Checking last ${count} messages in channel`, message.channel);
        let channel = await message.channel.fetch();
        let channelMessages = await channel.messages.fetch({limit: count, cache: false});
        return channelMessages;
    }
    

    public async FetchGuildMembers(guild:string): Promise<GuildMember[]> {
        let fetchedGuild = await this._client.guilds.fetch(guild);
        await fetchedGuild.channels.fetch();
        let fetchedMembers = await fetchedGuild.members.fetch(); 
        return Array.from(fetchedMembers.values());
    }
}

