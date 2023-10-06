import {DiscordService} from "../index";
import {User} from "./User";
import {Guild} from "../guilds/Guild";

export class UserManagement {

    constructor(private discordService: DiscordService) {
    }

    async getUser(sub: string): Promise<User> {
        const request = () => this.discordService.client.get('/users/@me')
        const {data} = await this.discordService.makeRequest(request, sub)

        return data
    }

    async getGuilds(sub: string): Promise<Guild[]> {
        const request = () => this.discordService.client.get('/users/@me/guilds')
        const {data} = await this.discordService.makeRequest(request, sub)

        return data
    }
}
