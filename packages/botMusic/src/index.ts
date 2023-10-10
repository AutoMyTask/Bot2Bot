import dotenv from "dotenv"
import config from "./app/config/config"
import {Bot} from "./lib/bot";
import {PingCommand} from "./app/ping/ping.command";
import {GatewayIntentBits} from "discord-api-types/gateway";

type ConfigBotMusique =  {
    tokenDiscord: string;
    tokenYoutube: string;
    clientId: string;
    guiId: string;

}

const start = async () => {

    dotenv.config()

    if (!config.api.youtube) throw new Error('Config api youtube must be defined')

    if (!process.env.TOKEN_DISCORD) throw new Error('TOKEN_DISCORD must be defined!')

    if (!process.env.TOKEN_YOUTBE) throw new Error('TOKEN_YOUTUBE must be defined')

    if (!process.env.CLIENT_ID) throw new Error('CLIENT_ID must be defined')

    if (!process.env.GUI_ID) throw new Error('GUI_ID must be defined')

    const bot = new Bot({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates,
        ]
        , token: process.env.TOKEN_DISCORD,
        guiId: process.env.GUI_ID,
        clientId: process.env.CLIENT_ID
    })

    await bot.bootstrap([
        PingCommand
    ], [
        PingCommand.youtubeButton
    ])
    await bot.deployCommands()
}

export default start;


