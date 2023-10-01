import {Params} from "../core/request/params/decorators/params.path.decorator";
import {Service} from "../core/request/params/decorators/params.service.decorator";
import {DiscordService} from "../discord";
import {Map} from "../core/request/params/decorators/params.map.decorator";
import {Auth} from "../auth0/auth0.service";
import {Body} from "../core/request/params/decorators/params.body.decorator";
import {UserRequest} from "./ressources/UserRequest";
import {UserResponse} from "./ressources/UserResponse";

export class UserController {
    public static async me(
        @Params('username') username: string,
        @Params('id', 'float') id: number,
        @Service() discordService: DiscordService,
        @Map('auth') auth: Auth
    ): Promise<UserResponse> {
        return await discordService.getUser(auth.payload.sub)
    }

    public static postUser(
        @Params('id') id: number,
        @Body userRequest: UserRequest,
    ): { oui: boolean } {
        return {oui: true}
    }
}
