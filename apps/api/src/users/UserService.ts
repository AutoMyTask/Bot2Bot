import {inject, injectable} from "inversify";
import {DiscordService} from "../discord";
import {UserResponse} from "./ressources/UserResponse";

@injectable()
export class UserService {
    constructor(
        @inject(DiscordService) private discordService: DiscordService
    ) {
    }

    async getUser(sub: string): Promise<UserResponse> {
        return await this.discordService.getUser(sub)
    }

}
