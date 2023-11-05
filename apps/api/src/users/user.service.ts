import {inject, injectable} from "inversify";
import {IUserResponse, UserResponse} from "./ressources/UserResponse";
import {Auth0IdentityDiscord} from "../auth0/auth0.identity.discord";

@injectable()
export class UserService {
    private populate = {
        discord: {
            user: () => this.auth0DiscordService.getUser()
        }
    }

    constructor(
        @inject(Auth0IdentityDiscord) private auth0DiscordService: Auth0IdentityDiscord
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
