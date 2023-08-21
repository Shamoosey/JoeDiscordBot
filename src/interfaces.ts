import { ActivityType, Collection, Guild, GuildMember, Message } from "discord.js";

export namespace Joebot{

    export interface Bot {
        Run(): Promise<void>;
    }

    export interface Helper{
        SetStatus(message:Joebot.StatusMessage): Promise<string>;
        GetHelpMessage():string;
        GetDadJoke():Promise<string>;
        GetRandomNumber(min:number, max:number):number;
        StringContains(str: string, contains:Array<string>, wholeWord?:boolean, excludeUrl?:boolean): boolean;
        GetRecentMessages(message:Message, count?: number):Promise<Collection<string, Message<boolean>>>;
        SendMessageToChannel(message:string, channelId?: string, ): Promise<string|undefined>;
        StringIsUrl(str: string): boolean;
        FetchGuildMembers(guild:string): Promise<GuildMember[]>
    }

    export namespace KickCache{
        export interface KickCacheService {
            FilterNonValidUsers(configuration: Joebot.Configuration.AppConfig): Promise<void>;
        }
        export interface CachedUser {
            userId: string;
            cachedDate: Date;
        }
    }

    export namespace Configuration {
        
        export interface ConfigurationService {
            DefaultResponses:Array<string>;
            StatusMessages: Array<StatusMessage>;
            InitializeAppConfigurations(): Promise<void>;
            GetAllConfigurations():Array<Joebot.Configuration.AppConfig>
            GetConfigurationForGuild(guildId: string): Joebot.Configuration.AppConfig | undefined;
            CheckTriggers(message:Message): Promise<Array<string>>;
        }
        

        export interface AppConfig {
            serverId: string;
            name: string;
            defaultChannel: string;
            enableKickCache: boolean;
            kickCacheDays: number;
            kickCacheHours: number;
            kickCacheServerMessage: string;
            kickCacheUserMessage: string;
            triggers: Array<Trigger>;
            users: Array<User>;
        }

        export interface User {
            id: string;
            isSecret: boolean;
            userName: string;
            discordUserId: string;
        }
        export interface Trigger {
            id: string;
            name: string;
            messageDelete?: boolean;
            sendRandomResponse?: boolean;
            ignoreCooldown?: boolean;
            triggerWords:Array<string>;
            triggerResponses?: Array<string>;
            reactEmotes?: Array<string>;
        }
    }

    export interface StatusMessage {
        status: string;
        type?: ActivityType;
    }

} 