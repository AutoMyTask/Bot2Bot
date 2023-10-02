import {UserService} from "./UserService";
import {IServiceCollection} from "api-common";

export const configure = (services: IServiceCollection) => {
    services.bind(UserService).to(UserService)
}
