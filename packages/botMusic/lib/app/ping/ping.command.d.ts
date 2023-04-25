import { CommandInteraction } from "discord.js";
import { BaseCommand } from "../../lib/commands/BaseCommand";
import { YoutubeButton } from "./youtube.button";
export declare class PingCommand extends BaseCommand {
    static youtubeButton: YoutubeButton;
    run(interaction: CommandInteraction): Promise<void>;
}
