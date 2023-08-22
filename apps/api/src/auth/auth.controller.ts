import {injectable, inject} from "inversify";
import {AuthService} from "./auth.service";
import {NextFunction, Request, Response} from "express";

export interface AuthRegisterResponse {
    auth: boolean
}

export interface AuthRegisterRequest {
    id: string
}

@injectable()
export class AuthController {
    constructor(@inject(AuthService) public authService: AuthService) {
    }

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            await this.authService.getAuth()
            res.json({
                auth: true
            })
        } catch (err) {
           return next(err)
        }
    }
}
