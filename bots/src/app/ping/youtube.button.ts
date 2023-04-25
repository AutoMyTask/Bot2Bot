import {ActionRowBuilder, ButtonBuilder} from "@discordjs/builders"
import {ButtonStyle} from "discord-api-types/payloads"
import {ButtonInteraction} from "discord.js"
import { v4 as uuidv4 } from 'uuid'

export class YoutubeButton {
    data = new ButtonBuilder()
        .setCustomId(`youtube-${uuidv4()}`)
        .setLabel('Youtube')
        .setStyle(ButtonStyle.Primary)

    async run(interaction: ButtonInteraction) {
        const row = new ActionRowBuilder()
            .addComponents(this.data)

        await interaction.reply({
            content: 'Pong',
            ephemeral: true,
            components: [row]
        });
    }
}
