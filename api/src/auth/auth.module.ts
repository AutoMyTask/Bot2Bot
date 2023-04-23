import {Container} from 'inversify'
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";
import {Application} from "express";
import {jwtCheck} from "./middlewares/jwt.check";


export class AuthModule {
    constructor(private container: Container, public app: Application) {
    }

    register(): void {
        this.container.bind<AuthService>(AuthService).toSelf();
        this.container.bind<AuthController>(AuthController).toSelf()
    }

    mapAuthEndpoints() {
        const authController = this.container.resolve<AuthController>(AuthController);
        this.app.post('/', jwtCheck, authController.getAuth.bind(authController))
    }
}
