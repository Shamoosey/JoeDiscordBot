require('dotenv').config();
import container from "./dependency-injection";
import { Bot } from "./bot";
import { Logger } from "winston";
import { Symbols } from "./enums";

const logger = container.get<Logger>(Symbols.Logger);

logger.info("** Application Startup **")

process.on("uncaughtException", (error) => {
    logger.error("*** Unhandled Error ***", error);
})

let bot = container.get<Bot>(Symbols.Bot);

bot.Run();