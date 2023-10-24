import {inject, injectable} from "inversify";
import {IUserResponse, UserResponse} from "./ressources/UserResponse";
import {Auth0DiscordService} from "../auth0/auth0.discord.service";

@injectable()
export class UserService {
    private populate = {
        discord: {
            user: () => this.auth0DiscordService.getUser()
        }
    }

    constructor(
        @inject(Auth0DiscordService) private auth0DiscordService: Auth0DiscordService
    ) {
    }


    async getUser(populateIdentity?: string): Promise<UserResponse> {
        let userResponse: IUserResponse = {
            discord: null
        }

        userResponse.discord = await this.auth0DiscordService.getUser()

        return userResponse
    }
}
