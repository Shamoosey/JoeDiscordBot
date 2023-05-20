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
        
        export interface KickCacheConfig{
            EnableKickerCache: boolean;
            KickCacheDays: number;
            KickCacheHours: number;
            KickServerMessage: string;
            KickedUserMessage: string;
        }
    }

    export namespace Configuration {

        export interface AppConfig {
            GuildId: string;
            Triggers: Array<Trigger>;
            SecretUsers: Array<string>;
            KickerCacheConfig: KickCache.KickCacheConfig;
            DefaultChannel: string;
        }
        
        export interface ConfigurationService {
            DefaultResponses:Array<string>;
            StatusMessages: Array<StatusMessage>;
            InitializeAppConfigurations(guilds:Array<string>): Promise<void>;
            GetAllConfigurations():Array<Joebot.Configuration.AppConfig>
            GetConfigurationForGuild(guildId: string): Joebot.Configuration.AppConfig | undefined;
            CheckTriggers(message:Message): Promise<Array<string>>;
        }

        export interface Trigger {
            TriggerWords:Array<string>;
            Responses?: Array<string>;
            MessageDelete?: boolean;
            SendRandomResponse?: boolean;
            IgnoreCooldown?: boolean;
            ReactEmote?: Array<string>;
        }
    }

    export interface StatusMessage {
        Status: string;
        Type?: ActivityType;
    }

} 