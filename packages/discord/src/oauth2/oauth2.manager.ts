import {DiscordService} from "../index";

export class Oauth2Manager {
    constructor(private discordService: DiscordService) {
    }

    async getCurrentAuthorizationInformation() {
        const request = () => this.discordService.client.get('/oauth2/@me')
        const {data} = await this.discordService.makeRequest(request)
        return data
    }
}
