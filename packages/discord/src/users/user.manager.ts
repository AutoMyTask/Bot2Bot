import {DiscordService} from "../index";
import {User} from "./user";
import {Guild} from "../guilds/Guild";

export class UserManager {

    constructor(private discordService: DiscordService) {
    }

    async getUser(): Promise<User> {
        const request = () => this.discordService.client.get('/users/@me')
        const {data} = await this.discordService.makeRequest(request)
        return data
    }

    async getGuilds(): Promise<Guild[]> {
        const request = () => this.discordService.client.get('/users/@me/guilds')
        const {data} = await this.discordService.makeRequest(request)

        return data
    }
}
