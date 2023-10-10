import {Service} from "../core/request/params/decorators/params.service.decorator";
import {Map} from "../core/request/params/decorators/params.map.decorator";
import {Auth} from "../auth0/auth0.service";
import {UserResponse} from "./ressources/UserResponse";
import {UserService} from "./user.service";
import {Params} from "../core/request/params/decorators/params.path.decorator";
import {Query} from "../core/request/params/decorators/params.query.decorator";

export class UserController {
    // Créer un paramètre pour populate les données provenant de discord
    // identity: discord.user, .... (utiliser des enums)
    // L'objectif ici et de ne pas crée une routes pour guilds, user....
    // Je veux récupérer toute les données identities associer au user à partir d'une seul et même route
    public static async me(
        @Service() userService: UserService,
        @Params('id', 'int') id: number,
        @Map('auth') auth: Auth,
        @Query('populate_identity') populate_identity: string
    ): Promise<UserResponse> {
        return await userService.getUser(auth.payload.sub)
    }
}
