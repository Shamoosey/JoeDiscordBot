import { Client, Collection, GuildMember, Message, TextChannel } from "discord.js";
import {inject, injectable} from "inversify";
import {Commands, ActivityTypes} from "./enums"
import {Joebot} from "./interfaces"
import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from "winston";

@injectable()
export class Helper implements Joebot.Helper {
    private _client: Client;
    private _logger: Logger;

    private kickerCacheEnabled = true;
    private readonly guild = "306275893167521792"
    private readonly defaultChannel = "306275893167521792";
    private noRoleMembers: Map<string, Date> = new Map<string, Date>();

    constructor(
        @inject("Client") client: Client,
        @inject("Logger") logger: Logger,
    ) {
        this._client = client;
        this._logger = logger;
    }

    public async SetStatus(message:string):Promise<string> {
        this._logger.info(`Changing status to "${message}"`)
        let returnMsg = "CAN'T CHANGE MY STATUS IF YOU DONT TELL ME WHAT YOU WANT JACK!";
        if(message != ""){
            await this._client.user.setActivity(message, {type: ActivityTypes.PLAYING})
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

    public StringContains(str: string, contains:Array<string>, wholeWord:boolean = true): boolean {
        let match = false;
        str = str.toLowerCase();
        for(let word of contains) {
            let formattedWord = word.toLowerCase();
            if(wholeWord){
                match = match || new RegExp('\\b' + formattedWord + '\\b', 'i').test(str);
            } else {
                match = match || str.indexOf(formattedWord) >= 0
            }
        }

        return match;
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

    public async FilterNonValidUsers(): Promise<void>{
        this._logger.info("Checking for non-valid users to add to cache")
        
        await this.updateCachedMembers(this.guild);
        let kickedUsersMessage = ""

        if(this.kickerCacheEnabled){
            const dayThreshold = 2;
            const hoursThreshold = 3;
            let guild = this._client.guilds.cache.find(x => {return x.id== this.guild})
            if(guild){
                for (let member of guild.members.cache.values()) {
                    let existingCachedMember = this.noRoleMembers.has(member.id);
                    if(existingCachedMember){
                        let cachedTime = new Date(this.noRoleMembers.get(member.id));
                        let threasholdDate = new Date(member.joinedAt)
                        cachedTime.setHours(cachedTime.getHours() + hoursThreshold)
                        threasholdDate.setDate(threasholdDate.getDate() + dayThreshold)

                        if(cachedTime < new Date() && threasholdDate < new Date()){
                            let memberDm = await member.createDM();
                            await memberDm.send("Hit the road JACK!");
                            await member.kick(`No assigned role after ${dayThreshold} days`);
                            this.noRoleMembers.delete(member.id)
                            this._logger.info(`${member.user.username} was kicked for not having an assigned role`, member)
                            kickedUsersMessage += `${kickedUsersMessage == "" ? "" : ", "}${member.user.username} 2yil`
                        }
                    }
                }
                if(kickedUsersMessage != ""){
                    const channel = this._client.channels.cache.get(this.defaultChannel) as TextChannel 
                    if(channel){
                        this._logger.info(`Sent message: '${kickedUsersMessage}' to channel:${channel.name}`,)
                        channel.send(kickedUsersMessage)
                    } else {
                        this._logger.info(`Could not find channel with id ${this.defaultChannel} to send message to`)
                    }
                }
            }
        }
    }

    public async GetRecentMessages(message:Message, count: number = 20): Promise<Collection<string, Message<boolean>>> {
        this._logger.info(`Checking last ${count} messages in channel`, message.channel);
        let channel = await message.channel.fetch();
        let channelMessages = await channel.messages.fetch({limit: count}, {cache: false});
        return channelMessages;
    }
    
    private async updateCachedMembers(guild:string): Promise<void> {
        let members = await this.fetchGuildMembers(guild);
        for(let member of members){
            let memberRoles = Array.from(member.roles.cache.values())
            let existingCachedMember = this.noRoleMembers.has(member.id);
            for(let role of memberRoles){
                if(role.name == "@everyone" && memberRoles.length == 1 && !existingCachedMember){
                    this.noRoleMembers.set(member.user.id, new Date)
                    this._logger.info(`${member.user.username} does not have an assigned role, adding to cache`);
                } else if(role.name != "@everyone" && existingCachedMember) {
                    this._logger.info(`${member.user.username} is assigned a role, removing user from cache`);
                    this.noRoleMembers.delete(member.id)
                }
            }
        }
    }

    private async fetchGuildMembers(guild:string): Promise<GuildMember[]> {
        let fetchedGuild = await this._client.guilds.fetch(guild);
        await fetchedGuild.channels.fetch();
        let fetchedMembers = await fetchedGuild.members.fetch(); 
        return Array.from(fetchedMembers.values());
    }


    //TO-DO fix the args
    private getCmdArgs(cmdMessage: string): string[]{
        //not working, needs some logic tweaking
        let args = cmdMessage.split('-').map(x => { return x.trim().toLowerCase() });
        if(args.length == 1 || (args.length == 1 && cmdMessage.split(" ").length == 2)){
            args = args[0].split(" ");
        }
        return args;
    }
}

