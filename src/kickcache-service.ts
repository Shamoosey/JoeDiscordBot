import { inject, injectable } from "inversify";
import { Joebot } from "./interfaces";
import TriggerMessages from "./data/TriggersMessages.json"
import { initializeApp, applicationDefault, cert } from "firebase-admin/app"
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore"
import { Client, Message, TextChannel } from "discord.js";
import { Logger } from "winston";
import { Symbols } from "./enums";

@injectable()
export class KickCacheService implements Joebot.KickCacheService {
    private _helper: Joebot.Helper;
    private _client: Client;
    private _logger: Logger;
    private _configService: Joebot.Configuration.ConfigurationService

    private _cachedUsers: Map<string, Array<Joebot.CachedUser>> = new Map<string, Array<Joebot.CachedUser>>();
    
    constructor (
        @inject(Symbols.Client) client: Client,
        @inject(Symbols.Helper) helper: Joebot.Helper,
        @inject(Symbols.Logger) logger: Logger,
        @inject(Symbols.ConfigService) configService: Joebot.Configuration.ConfigurationService
    ) {
        this._helper = helper
        this._client = client;
        this._logger = logger;
        this._configService = configService;
    }

    public async FilterNonValidUsers(): Promise<void>{
        this._logger.info("Checking for non-valid users to add to cache");

        //Update these to user trigger service once implemented
        let guildId = ""
        let defaultChannel = ""

        await this.updateCachedMembers(guildId);
        let kickedUsersMessage = ""
        
        const dayThreshold = 2;
        const hoursThreshold = 3;
        let guild = this._client.guilds.cache.find(x => {return x.id== guildId})
        if(guild){
            for (let member of guild.members.cache.values()) {
                let existingCachedMember = this.isCachedUser(guildId, member.user.id);
                if(existingCachedMember){
                    let user = this.getCachedUser(guildId, member.user.id);
                    let cachedTime = new Date(user.cachedDate);
                    let threasholdDate = new Date(member.joinedAt);
                    cachedTime.setHours(cachedTime.getHours() + hoursThreshold)
                    threasholdDate.setDate(threasholdDate.getDate() + dayThreshold)

                    if(cachedTime < new Date() && threasholdDate < new Date()){
                        let memberDm = await member.createDM();
                        await memberDm.send("Hit the road JACK!");
                        await member.kick(`No assigned role after ${dayThreshold} days`);
                        this.updateGuildCachedArray(guildId, member.user.id, true);
                        this._logger.info(`${member.user.username} was kicked for not having an assigned role`, member)
                        kickedUsersMessage += `${kickedUsersMessage == "" ? "" : ", "}${member.user.username} 2yil`
                    }
                }
            }
            if(kickedUsersMessage != ""){
                const channel = this._client.channels.cache.get(defaultChannel) as TextChannel 
                if(channel){
                    this._logger.info(`Sent message: '${kickedUsersMessage}' to channel:${channel.name}`,)
                    channel.send(kickedUsersMessage)
                } else {
                    this._logger.info(`Could not find channel with id ${defaultChannel} to send message to`)
                }
            }
    }
    }

    private async updateCachedMembers(guildId:string): Promise<void> {
        let members = await this._helper.FetchGuildMembers(guildId);
        for(let member of members){
            let memberRoles = Array.from(member.roles.cache.values())
            let userCached = this.isCachedUser(guildId, member.user.id);
            for(let role of memberRoles){
                if(role.name == "@everyone" && memberRoles.length == 1 && !userCached){
                    this.updateGuildCachedArray(guildId, member.user.id, false);
                    this._logger.info(`${member.user.username} does not have an assigned role, adding to cache`);
                } else if(role.name != "@everyone" && userCached) {
                    this._logger.info(`${member.user.username} is assigned a role, removing user from cache`);
                    this.updateGuildCachedArray(guildId, member.user.id, true);
                }
            }
        }
    }

    private isCachedUser(guildId:string, userId:string): boolean {
        let result = false;

        if(this._cachedUsers.has(guildId)){
            let cache = this._cachedUsers.get(guildId);
            if(cache.find(x => x.userId == userId) != undefined){
                result = true;
            }
        }

        return result;  
    }

    private getCachedUser(guildId: string, userId: string): Joebot.CachedUser {
        let result = null;

        if(this._cachedUsers.has(guildId)){
            let cache = this._cachedUsers.get(guildId);
            let user = cache.find(x => x.userId == userId);
            if(user != undefined){
                result = user
            }
        }

        return result;  
    }


    private updateGuildCachedArray(guildId:string, userId:string, remove:boolean){
        let cache = new Array<Joebot.CachedUser>;
        if(this._cachedUsers.has(guildId)){
            cache = this._cachedUsers.get(guildId);
            if(remove){
                let i = cache.findIndex( (x) => x.userId == userId);
                if ( i > 0){
                    cache.slice(i, 1);
                    this._logger.log("Removing user from the cache", userId);
                }
            }
        }
        if(!remove){
            let existingCache = cache.find(x => x.userId == userId);
            if(existingCache != undefined){
                cache.push({
                    userId: userId,
                    cachedDate: new Date() 
                });
                this._cachedUsers.set(guildId, cache)
                this._logger.log("Adding user to the cache", userId);
            } else {
                this._logger.log("User already exists in cache", userId)
            }
        }
    }
}