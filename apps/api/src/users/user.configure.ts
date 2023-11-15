import { UserService } from "./user.service";
import { IServiceCollection } from "api-core-types";

export const userConfigure = (services: IServiceCollection) => {
  services.bind(UserService).to(UserService);
};
