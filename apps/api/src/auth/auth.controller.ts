import {injectable, inject} from "inversify";
import {AuthService} from "./auth.service";
import {IsNotEmpty, IsString} from "class-validator";
import {OpenapiProp} from "../openapi/decorators/openapi.prop";
import {Body, RouteMapBuilderCallBack, Service} from "../app.builder";
import {MetadataTag} from "../openapi/metadata/metadataTag";
import {MetadataProduce} from "../openapi/metadata/metadataProduce";
import {StatutCodes} from "../http/StatutCodes";
import {OpenApiBadRequestObject} from "../http/errors/BadRequest";

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
        @Service(AuthService) authService: AuthService
    ): Promise<AuthRegisterResponse> {
        const result = await authService.getAuth()
        return new AuthRegisterResponse()
    }
}


export const authEndpoints: RouteMapBuilderCallBack = (routeMapBuilder) => {
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
