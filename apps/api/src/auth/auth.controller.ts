import {AuthService} from "./auth.service";
import {IsNotEmpty, IsString} from "class-validator";
import {OpenapiProp} from "../openapi/decorators/openapi.prop";
import {MetadataTag} from "../openapi/metadata/metadataTag";
import {MetadataProduce} from "../openapi/metadata/metadataProduce";
import {OpenApiBadRequestObject} from "../http/errors/BadRequest";
import {Service} from "../core/request/params/decorators/params.service.decorator";
import {Body} from "../core/request/params/decorators/params.body.decorator";
import {CallbackRouteMapBuilder, IRouteMapBuilder} from "../core/routes/types";
import {StatutCodes} from "../core/http/StatutCodes";

export class AuthRegisterResponse {
    @OpenapiProp('boolean')
    auth: boolean = true
}

export class AuthRegisterRequest {

    @IsNotEmpty()
    @IsString()
    @OpenapiProp('string', {required: true})
    id!: string
}

export class AuthController {
    static async register(
        @Body authRequest: AuthRegisterRequest,
        @Service() authService: AuthService
    ): Promise<AuthRegisterResponse> {
        const result = await authService.getAuth()
        return new AuthRegisterResponse()
    }
}


export const authEndpoints: CallbackRouteMapBuilder<IRouteMapBuilder> = (routeMapBuilder) => {
    const auth = routeMapBuilder
        .mapGroup('/auth')
        .withMetadata(new MetadataTag('Auth', "Description d'auth"))

    auth
        .map('/register', 'post', AuthController, AuthController.register)
        .withMetadata(
            new MetadataProduce(
                AuthRegisterResponse,
                StatutCodes.Status200OK
            )
        ).withMetadata(
            new MetadataProduce(
                OpenApiBadRequestObject,
                StatutCodes.Status400BadRequest
            )
        )

    return routeMapBuilder
}
