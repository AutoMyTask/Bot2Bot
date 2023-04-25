import {CommandInteraction} from "discord.js";
import {
    ActionRowBuilder,
    SlashCommandBuilder
} from "@discordjs/builders";
import {Command} from "../../lib/commands/decorators/command";
import {BaseCommand} from "../../lib/commands/BaseCommand";
import {YoutubeButton} from "./youtube.button";

@Command({
    data: new SlashCommandBuilder()
        .setName('musique')
        .setDescription('Gérer la playlist de musique'),
})
export class PingCommand extends BaseCommand {
    static youtubeButton = new YoutubeButton()

    async run(interaction: CommandInteraction) {
        const row = new ActionRowBuilder()
            .addComponents(PingCommand.youtubeButton.data)

        await interaction.reply({
            content: 'Pong',
            ephemeral: true,
            components: [row]
        });
    }

    async onYoutube() {

    }

    async onSpotify() {

    }
}
