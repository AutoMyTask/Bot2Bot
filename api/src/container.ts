import {Container} from "inversify";
import {Endpoints} from "./endpoints";
import {AuthModule} from "./auth/auth.module";
import express, {Application} from "express";
import {AuthService} from "./auth/auth.service";
import {AuthController} from "./auth/auth.controller";
import {Swagger} from "./swagger/swagger";

const container = new Container()

container.bind<Application>('Application')
    .toDynamicValue(() => express())
    .inSingletonScope()

container.bind(Swagger).toSelf().inSingletonScope()

container.bind(Endpoints).toSelf().inSingletonScope()

container.bind<AuthService>(AuthService).toSelf()
container.bind<AuthController>(AuthController).toSelf()
container.bind(AuthModule).toSelf().inSingletonScope()

export default container
