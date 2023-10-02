import {Service} from "../core/request/params/decorators/params.service.decorator";
import {Map} from "../core/request/params/decorators/params.map.decorator";
import {Auth} from "../auth0/auth0.service";
import {UserResponse} from "./ressources/UserResponse";
import {UserService} from "./UserService";


export class UserController {
    public static async me(
        @Service() userService: UserService,
        @Map('auth') auth: Auth
    ): Promise<UserResponse> {
        return await userService.getUser(auth.payload.sub)
    }
}
