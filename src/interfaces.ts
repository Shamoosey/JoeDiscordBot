import { ActivityType, Collection, GuildMember, Message } from "discord.js";

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

    export interface KickCacheService {
        FilterNonValidUsers(): Promise<void>;
    }

    export interface CachedUser {
        userId: string;
        cachedDate: Date;
    }

    export namespace Configuration {

        export interface AppConfig {
            GuildId: string;
            StatusMessages: Array<StatusMessage>;
            Triggers: Array<Trigger>;
            SecretUsers: Array<string>;
            EnableKickerCache: boolean;
            DefaultChannel: string;
        }

        export interface ConfigurationService {
            DefaultResponses:Array<string>;
            InitializeAppConfigurations(): Promise<void>;
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