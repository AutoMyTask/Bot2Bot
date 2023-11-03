import {commands, Commands} from "./decorators/commands";
import {
    ChatInputCommandInteraction, Interaction,
    MessageContextMenuCommandInteraction, MessageInteraction,
    UserContextMenuCommandInteraction
} from "discord.js";

export class CommandManager {
    registerCommands(commandsClasses: any[]) {
        Commands(commandsClasses)
    }

    getCommandByInteraction(interaction: Interaction) {
        let command = undefined

        if (interaction.isButton()) {
            if (interaction.message.interaction) {
                command = commands.get(interaction.message.interaction.commandName)
            }
        }

        if (interaction.isCommand()) {
            command = commands.get(interaction.commandName)
        }

        return command
    }

}
