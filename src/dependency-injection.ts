import "reflect-metadata";
import { Container } from "inversify";
import { Bot } from "./bot";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { Helper } from "./helper";
import { Logger } from "winston";
import { LogFactory } from "./logFactory";
import { ConfigurationService } from "./trigger-service";
import { Joebot } from "./interfaces";
import { Symbols } from "./enums";
import { KickCacheService } from "./kickcache-service";

const container = new Container();

const client = new Client({ 
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ], 
    partials: [
        Partials.Message, 
        Partials.Channel, 
        Partials.GuildMember
    ] 
});

container.bind<Joebot.Bot>(Symbols.Bot).to(Bot).inSingletonScope();
container.bind<Client>(Symbols.Client).toConstantValue(client);
container.bind<Joebot.Helper>(Symbols.Helper).to(Helper).inSingletonScope();
container.bind<Logger>(Symbols.Logger).toConstantValue(LogFactory.GetNewLogger());
container.bind<Joebot.Configuration.ConfigurationService>(Symbols.ConfigService).to(ConfigurationService).inSingletonScope();
container.bind<Joebot.KickCacheService>(Symbols.KickCacheService).to(KickCacheService).inSingletonScope();
export default container;