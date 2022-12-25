
export enum Commands {
    Status = "status",
    Help = "help",
    WeedBad = "weedbad",
    DadJoke = "dadjoke",
    Suggestion = "suggestion"
}

export const Symbols = {
	Bot: Symbol.for("Bot"),
	Helper: Symbol.for("Helper"),
	Logger: Symbol.for("Logger"),
	Client: Symbol.for("Client"),
    ConfigService: Symbol.for("ConfigService"),
    KickCacheService: Symbol.for("KickCacheService")
}