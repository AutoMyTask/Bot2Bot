import {
    ButtonInteraction, ChatInputCommandInteraction,
    Client, Interaction,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction
} from "discord.js";
import {commands} from "./commands/decorators/commands";
import {Routes} from "discord-api-types/rest";
import {REST} from "@discordjs/rest";
import configApiDiscord from './config/discord.api'
import {GatewayIntentBits} from "discord-api-types/gateway";
import {CommandManager} from "./commands/CommandManager";
import {ButtonManager} from "./buttons/ButtonManager";

interface BotConfig {
    intents: GatewayIntentBits[],
    token: string,
    clientId: string,
    guiId: string,
}

export class Bot {
    private readonly _client: Client

    private readonly _rest: REST

    private readonly _commandManager = new CommandManager()
    private readonly _buttonManager = new ButtonManager()
    constructor(private config: BotConfig) {
        this._client = new Client({intents: config.intents})

        this._rest = new REST(configApiDiscord).setToken(config.token)

        this._client.on('ready', c => {
            console.log(`${c.user.tag} est prêt a vous servir`)
        })
    }

    async bootstrap(commandsClasses: any[], buttons: any[]): Promise<void> {
        await this._client.login(this.config.token)

        this._commandManager.registerCommands(commandsClasses)
        this._buttonManager.registerButtons(buttons)


        this._client.on('interactionCreate', async interaction => {

            if (interaction.isButton()) {
                await this._handleButtonInteraction(interaction)
            }

            if (interaction.isCommand()) {
                await this._handleCommandInteraction(interaction)
            }
        })
    }

    private async _handleButtonInteraction(interaction: ButtonInteraction) {
        const button = this._buttonManager.buttons.get(interaction.customId)

        if (!button) {
            console.error(`No button matching ${interaction.customId} was found.`);
            return;
        }

        try {
            await button.execute(interaction)
        } catch (err) {
            console.log(err)
            await this._sendErrorMessage(interaction)
        }
    }

    private async _handleCommandInteraction(interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction) {
        const command = this._commandManager.getCommandByInteraction(interaction)

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`)
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await this._sendErrorMessage(interaction)
        }
    }

    private async _sendErrorMessage(interaction: ButtonInteraction | ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction) {
        const errorMessage = 'There was an error while executing this command!';
        const messageOptions = {ephemeral: true};

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({content: errorMessage, ...messageOptions});
        } else {
            await interaction.reply({content: errorMessage, ...messageOptions});
        }
    }

    async deployCommands(): Promise<void> {

        const body = commands.map(command => command.data.toJSON())
        await this._rest.put(
            Routes.applicationGuildCommands(this.config.clientId || '', this.config.guiId || ''),
            {body},
        ).catch(error => {
            console.log(error)
        });
    }
}
