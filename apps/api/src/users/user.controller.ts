import {UserResponse} from "./ressources/UserResponse";
import {UserService} from "./user.service";
import {Auth} from "auth0";
import {Params, Query, Service, Map} from "api-core";

export class UserController {
    // Créer un paramètre pour populate les données provenant de discord
    // identity: discord.user, .... (utiliser des enums)
    // L'objectif ici et de ne pas crée une routes pour guilds, user....
    // Je veux récupérer toute les données identities associer au user à partir d'une seul et même route
    // Lors du post/put je devrait indiquer un objet spécifique à chaque api externes
    public static async me(
        @Service() userService: UserService,
        @Params('id', 'int') id: number,
        @Map('auth') auth: Auth,
        @Query('populate_identity', { required: false }) populate_identity?: string
    ): Promise<UserResponse> {
        return await userService.getUser()
    }
}
