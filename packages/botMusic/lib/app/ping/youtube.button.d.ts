import { ButtonBuilder } from "@discordjs/builders";
import { ButtonInteraction } from "discord.js";
export declare class YoutubeButton {
    data: ButtonBuilder;
    run(interaction: ButtonInteraction): Promise<void>;
}
