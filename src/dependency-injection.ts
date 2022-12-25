import "reflect-metadata";
import { Container } from "inversify";
import { Bot } from "./bot";
import { Client, Partials } from "discord.js";
import { Helper } from "./helper";
import { Logger } from "winston";
import { LogFactory } from "./logFactory";
import { Triggers } from "./trigger-service";
import { Joebot } from "./interfaces";

let container = new Container();

container.bind<Joebot.Bot>("Bot").to(Bot).inSingletonScope();
container.bind<Client>("Client").toConstantValue(new Client({ intents: 32767, partials: [Partials.Message, Partials.Channel] }));
container.bind<string>("Token").toConstantValue(process.env.JOE_TOKEN);
container.bind<Joebot.Helper>("Helper").to(Helper).inSingletonScope();
container.bind<Logger>("Logger").toConstantValue(LogFactory.GetNewLogger());
container.bind<Joebot.Triggers.TriggerService>("Triggers").to(Triggers).inSingletonScope();

export default container;