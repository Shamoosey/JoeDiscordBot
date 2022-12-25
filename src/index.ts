require('dotenv').config();
import container from "./dependency-injection";
import { Bot } from "./bot";
import { Logger } from "winston";

const logger = container.get<Logger>("Logger");

logger.info("** Application Startup **")

process.on("uncaughtException", (error) => {
    logger.error("*** Unhandled Error ***", error);
})

let bot = container.get<Bot>("Bot");

bot.Run();