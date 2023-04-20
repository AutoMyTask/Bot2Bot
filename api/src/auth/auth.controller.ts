import {injectable, inject} from "inversify";
import {AuthService} from "./auth.service";
import {IAuthService} from "./IAuthService";
import {Request, Response} from "express";

@injectable()
export class AuthController{
    constructor(@inject(AuthService) public authService: AuthService) {
    }

    async getAuth(req: Request, res: Response){
        await this.authService.getAuth();
        res.send('Auth route')
    }
}
