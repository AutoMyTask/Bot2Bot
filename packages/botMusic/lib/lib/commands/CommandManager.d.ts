import { Interaction } from "discord.js";
export declare class CommandManager {
    registerCommands(commandsClasses: any[]): void;
    getCommandByInteraction(interaction: Interaction): any;
}
