import { Client, GuildMember, TextChannel } from "discord.js";
import {inject, injectable} from "inversify";
import {Commands, ActivityTypes} from "./enums"
import {Smokebot} from "./interfaces"
import axios, { AxiosRequestConfig } from 'axios';
import { Logger } from "winston";

@injectable()
export class Helper implements Smokebot.IHelper {
    private _client: Client;
    private readonly _token: string;
    private _logger: Logger;

    private kickerCacheEnabled = true;
    private readonly guild = "754070498425438300"
    private readonly defaultChannel = "754070499042001058";
    private noRoleMembers: Map<string, Date> = new Map<string, Date>();

    constructor(
        @inject("Client") client: Client,
        @inject("Token") token: string,
        @inject("Logger") logger: Logger,
    ) {
        this._client = client;
        this._token = token;
        this._logger = logger;
    }
    
    public async SetStatus(message:string):Promise<string> {
        await this._client.user.setActivity(message, {type: ActivityTypes.PLAYING})
        return `Status changed to: ${message}`;
    }
    
    public GetHelpMessage(): string {
        let returnMessage: string =`Available Commands:`;
        let commands: string[] = Object.values(Commands);
        
        commands.forEach(item => {
            returnMessage += `\n${process.env.PREFIX}${item}`
        });
        
        return returnMessage;
    }

    
    public async GetDadJoke(): Promise<string> {
        let message:string; 
        try{
            let config:AxiosRequestConfig = {
                headers:{
                    Accept: "text/plain"
                }
            }
            let response = await axios.get("https://icanhazdadjoke.com/", config)
            message = response.data;
        } catch (e){
            this._logger.error("Error occured while requesting data joke", e)
            message = "An error occured, try again"
        }
        return message;
    }

    public GetRandomNumber(min:number, max:number):number{
        return Math.floor(Math.random() * (max - min) ) + min;
    }

    public async FilterNonValidUsers(): Promise<void>{
        this._logger.info("Checking for non-valid users to add to cache")
        
        await this.updateCachedMembers(this.guild);
        let kickedUsersMessage = ""

        if(this.kickerCacheEnabled){
            const dayThreshold = 2;
            const hoursThreshold = 1;
            let guild = this._client.guilds.cache.find(x => {return x.id== this.guild})
            if(guild){
                for (let member of guild.members.cache.values()) {
                    let existingCachedMember = this.noRoleMembers.has(member.id);
                    if(existingCachedMember){
                        let cachedTime = new Date(this.noRoleMembers.get(member.id));
                        let threasholdDate = new Date(member.joinedAt)
                        cachedTime.setMinutes(cachedTime.getMinutes() + hoursThreshold)
                        // cachedTime.setHours(cachedTime.getHours() + hoursThreshold)
                        // threasholdDate.setDate(threasholdDate.getDate() + dayThreshold)

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
    
    private async updateCachedMembers(guild:string): Promise<void> {
        let members = await this.fetchGuildMembers(guild);
        for(let member of members){
            let memberRoles = Array.from(member.roles.cache.values())
            let existingCachedMember = this.noRoleMembers.has(member.id);
            for(let role of memberRoles){
                if(role.name == "@everyone" && memberRoles.length == 1 && !existingCachedMember){
                    this.noRoleMembers.set(member.user.id, new Date)
                    this._logger.info(`${member.user.username} does not have an assigned role, adding to cache`, member);
                } else if(role.name != "@everyone" && existingCachedMember) {
                    this._logger.info(`${member.user.username} is assigned a role, removing user from cache`, member);
                    let index = this.noRoleMembers.delete(member.id)
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

