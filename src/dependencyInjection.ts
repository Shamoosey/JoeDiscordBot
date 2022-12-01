import "reflect-metadata";
import { Container } from "inversify";
import { Bot } from "./bot";
import { Client, Intents } from "discord.js";
import { Helper } from "./helper";
import { Logger } from "winston";
import { LogFactory } from "./logFactory";
import { Triggers } from "./Triggers";
import { Joebot } from "./interfaces";

let container = new Container();
let intents = new Intents(32767);
container.bind<Joebot.Bot>("Bot").to(Bot).inSingletonScope();
container.bind<Client>("Client").toConstantValue(new Client({ intents: intents, partials: ['MESSAGE', 'CHANNEL'] }));
container.bind<string>("Token").toConstantValue(process.env.JOE_TOKEN);
container.bind<Joebot.Helper>("Helper").to(Helper).inSingletonScope();
container.bind<Logger>("Logger").toConstantValue(LogFactory.GetNewLogger());
container.bind<Joebot.Triggers>("Triggers").to(Triggers).inSingletonScope();

export default container;