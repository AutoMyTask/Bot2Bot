import { GatewayIntentBits } from "discord-api-types/gateway";
interface BotConfig {
    intents: GatewayIntentBits[];
    token: string;
}
export declare class Bot {
    private readonly _client;
    private readonly _rest;
    private readonly _commandManager;
    private readonly _buttonManager;
    constructor(config: BotConfig);
    bootstrap(commandsClasses: any[], buttons: any[]): Promise<void>;
    private _handleButtonInteraction;
    private _handleCommandInteraction;
    private _sendErrorMessage;
    deployCommands(): Promise<void>;
}
export {};
