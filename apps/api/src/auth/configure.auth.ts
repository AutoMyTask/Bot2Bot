import {interfaces} from "inversify";
import {AuthService} from "./auth.service";
import {ConfigureServiceCallback} from "../core/app.builder";

export const configureAuth: ConfigureServiceCallback = (services: interfaces.Container) => {
    services.bind(AuthService).toSelf()
}
