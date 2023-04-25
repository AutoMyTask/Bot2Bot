import { CommandInteraction } from "discord.js";
export declare abstract class BaseCommand {
    abstract run(interaction: CommandInteraction): Promise<void>;
}
