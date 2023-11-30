import { UserResponse } from "./ressources/UserResponse";
import { UserService } from "./user.service";
import { Auth } from "auth0";
import { Params, Query, Service, Map } from "api-core";

export class UserController {
  // Privilégier plutôt une route /discord/@me
  public static async me(
    @Service() userService: UserService,
    @Params("id", "int") id: number,
    @Map("auth") auth: Auth,
    @Query("populate_identity", { required: false }) populate_identity?: string,
  ): Promise<UserResponse> {
    return await userService.getUser();
  }
}
