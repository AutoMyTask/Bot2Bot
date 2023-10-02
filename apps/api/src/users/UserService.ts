import {inject, injectable} from "inversify";
import {DiscordService} from "../discord";
import {UserResponse} from "./ressources/UserResponse";

@injectable()
export class UserService {
    constructor(
        @inject(DiscordService) private discordService: DiscordService
    ) {
    }

    // Peut-être créer un paramètre spécifique pour populate l'utilisateur des données
    // provenant de discord ou autre plateforme
    async getUser(sub: string): Promise<UserResponse> {
        return await this.discordService.user.getUser(sub)
    }
}
