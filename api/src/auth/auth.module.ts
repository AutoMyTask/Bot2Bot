import 'reflect-metadata'
import {inject, injectable} from 'inversify'
import {Endpoints} from "./../endpoints";
import {AuthController, AuthRegisterResponse} from "./auth.controller";
import {StatutCodes} from "./../http/StatutCodes";

@injectable()
export class AuthModule {

    constructor(
        @inject(Endpoints) private _endpoints: Endpoints,
        @inject(AuthController) private _authController: AuthController
    ) {
    }

    mapAuthEndpoints() {
        const auth = this._endpoints
            .mapGroup('/auth')
            .withTags('Auth')

        auth
            .map('/register', 'post', this._authController.register.bind(this._authController))
            .request(
                `${__dirname}/auth.controller.ts`,
                'AuthRegisterRequest'
                )
            .produce(
                StatutCodes.Status200OK,
                `${__dirname}/auth.controller.ts`,
                'AuthRegisterResponse'
            )
    }
}
