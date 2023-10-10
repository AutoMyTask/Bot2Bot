import {inject, injectable} from "inversify";
import {DiscordService} from "../discord";
import {IUserResponse, UserResponse} from "./ressources/UserResponse";

@injectable()
export class UserService {
    private populate = {
        discord: {
            user: (sub:string) => this.discordService.user.getUser(sub)
        }
    }

    constructor(
        @inject(DiscordService) private discordService: DiscordService
    ) {
    }


    async getUser(sub: string, populateIdentity?: string): Promise<UserResponse> {
        let userResponse: IUserResponse = {
            discord: null
        }

        userResponse.discord = await this.discordService.user.getUser(sub)

        return userResponse
    }
}
