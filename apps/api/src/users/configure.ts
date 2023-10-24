import {UserService} from "./user.service";
import {IServiceCollection} from "api-core-types";

export const configure = (services: IServiceCollection) => {
    services.bind(UserService).to(UserService)
}
