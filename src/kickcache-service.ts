import { inject, injectable } from "inversify";
import { Joebot } from "./interfaces";
import { Client, Guild, Message, TextChannel } from "discord.js";
import { Logger } from "winston";
import { Symbols } from "./enums";

@injectable()
export class KickCacheService implements Joebot.KickCache.KickCacheService {
    private _helper: Joebot.Helper;
    private _client: Client;
    private _logger: Logger;

    private _cachedUsers: Map<string, Array<Joebot.KickCache.CachedUser>> = new Map<string, Array<Joebot.KickCache.CachedUser>>();
    
    constructor (
        @inject(Symbols.Client) client: Client,
        @inject(Symbols.Helper) helper: Joebot.Helper,
        @inject(Symbols.Logger) logger: Logger,
    ) {
        this._helper = helper
        this._client = client;
        this._logger = logger;
    }

    public async FilterNonValidUsers(config: Joebot.Configuration.AppConfig): Promise<void>{
        this._logger.info("Checking for non-valid users to add to cache for config", config);
        let guildId = config.serverId;
        let guild = this._client.guilds.cache.find(x => x.id == guildId);
        let kickedUsersMessage = ""

        await this.updateCachedMembers(guildId);

        for (let member of guild.members.cache.values()) {
            let existingCachedMember = this.isCachedUser(guildId, member.user.id);
            if(existingCachedMember){
                let user = this.getCachedUser(guildId, member.user.id);
                //Get the date the user was added to the cache
                let cachedTime = new Date(user.cachedDate);
                //Get the date the user joined server at
                let threasholdDate = new Date(member.joinedAt);

                //Add the hours threshold to the cachedTime the user was cached at 
                cachedTime.setHours(cachedTime.getHours() + config.kickCacheHours)

                //Add the days threshold to the time the server joined the server at.
                threasholdDate.setDate(threasholdDate.getDate() + config.kickCacheDays)

                if(cachedTime < new Date() && threasholdDate < new Date()){
                    let memberDm = await member.createDM();
                    await memberDm.send(config.kickCacheUserMessage);
                    await member.kick(`No assigned role after ${config.kickCacheDays} days`);
                    this.removeItemFromCache(guildId, member.user.id);
                    this._logger.info(`${member.user.username} was kicked for not having an assigned role`, member)
                    kickedUsersMessage += `${kickedUsersMessage == "" ? "" : ", "}${member.user.username} ${config.kickCacheServerMessage}`
                }
            }
        }
        if(kickedUsersMessage != ""){
            const channel = this._client.channels.cache.get(config.defaultChannel) as TextChannel 
            if(channel){
                this._logger.info(`Sent message: '${kickedUsersMessage}' to channel:${channel.name}`,)
                channel.send(kickedUsersMessage)
            } else {
                this._logger.info(`Could not find channel with id ${config.defaultChannel} to send message to`)
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
                    this.addItemToCache(guildId, member.user.id);
                    this.addItemToCache(guildId, member.user.id);
                    this._logger.info(`${member.user.username} does not have an assigned role, adding to cache`);
                } else if(role.name != "@everyone" && userCached) {
                    this._logger.info(`${member.user.username} is assigned a role, removing user from cache`);
                    this.removeItemFromCache(guildId, member.user.id);
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

    private getCachedUser(guildId: string, userId: string): Joebot.KickCache.CachedUser {
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

    private removeItemFromCache(guildId: string, userId: string): void{
        if(this._cachedUsers.has(guildId)){
            let cache = this._cachedUsers.get(guildId);
            let cachedUserIndex = cache.findIndex(x => x.userId == userId);
            if(cachedUserIndex >= 0){
                cache.splice(cachedUserIndex);
                this._cachedUsers.set(guildId, cache);
            }
        }
    }

    private addItemToCache(guildId:string, userId:string): void{
        let cache = new Array<Joebot.KickCache.CachedUser>();
        let userIsCached = false;
        if(this._cachedUsers.has(guildId)){
            cache = this._cachedUsers.get(guildId);
            userIsCached = cache.find(x => x.userId == userId) != undefined;
        }
        if(!userIsCached){
            cache.push({
                userId: userId,
                cachedDate: new Date()
            });
        }
        this._cachedUsers.set(guildId, cache);
    }
}