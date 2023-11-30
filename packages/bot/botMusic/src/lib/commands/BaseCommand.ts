import {CommandInteraction} from "discord.js";

export abstract class BaseCommand {
    public abstract run(interaction: CommandInteraction): Promise<void>
}
