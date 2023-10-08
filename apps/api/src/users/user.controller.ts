import {Service} from "../core/request/params/decorators/params.service.decorator";
import {Map} from "../core/request/params/decorators/params.map.decorator";
import {Auth} from "../auth0/auth0.service";
import {UserResponse} from "./ressources/UserResponse";
import {UserService} from "./user.service";
import {Params} from "../core/request/params/decorators/params.path.decorator";
import {Query} from "../core/request/params/decorators/params.query.decorator";

export class UserController {
    // Créer un paramètre pour populate les données provenant de discord
    // Je pense que cela serra dans query via une chaine de caractére
    // Rajouter un 'include' en option dans userService
    public static async me(
        @Service() userService: UserService,
        @Params('id', 'int') id: number,
        @Map('auth') auth: Auth,
        @Query('oneNumber', {required: true}) oneNumber?: number
    ): Promise<UserResponse> {
        console.log(id)
        console.log(id)
        return await userService.getUser(auth.payload.sub)
    }
}
