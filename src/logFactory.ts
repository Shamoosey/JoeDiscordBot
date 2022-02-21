import moment from "moment";
import { createLogger, format, Logger, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Http } from "winston/lib/winston/transports";

export abstract class LogFactory {
    private static tsFormat = moment().format('YYYY-MM-DD hh:mm:ss').trim();
    private static logLevel = "info"

    private static fileTransport = new DailyRotateFile ({
        filename: "bidenbot-%DATE%.log",
        datePattern: "YYYY-MM-DD-HH",
        dirname: "./logs",
        maxFiles: '7d'
    });

    private static httpTransport = new Http({
        host: "192.168.0.123",
        port: 12202 ,
        path: "/gelf",
        format: LogFactory.getLogformat()
    })

    public static GetNewLogger(): Logger {
        let logger = createLogger({
            level: this.logLevel,
            transports: [
                this.fileTransport,
                this.httpTransport,
            ],
            format: LogFactory.getLogformat()
        })
        
        if(process.env.NODE_ENV == "dev"){
            logger.add(new transports.Console())
        }

        return logger;
    }

    private static getLogformat(){
        return format.combine(
            format.timestamp({format: this.tsFormat}),
            format.prettyPrint(),
            format.printf(({
                timestamp,
                level,
                message,
                ...meta
            }) => `${timestamp} | ${level} | ${message} ${this.formatMeta(meta)}`)
        )
        
    }

    private static formatMeta(meta:any){
        const splat = meta[Symbol.for('splat')];
        if (splat && splat.length) {
            return splat.length === 1 ? JSON.stringify(splat[0]) : JSON.stringify(splat);
        }
        return '';
    }
}
