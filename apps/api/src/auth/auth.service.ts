import {IAuthService} from "./IAuthService";
import {injectable} from 'inversify'
import "reflect-metadata"
import {IUser, User} from "./../users/User";

@injectable()
export class AuthService implements IAuthService {
    async getAuth(): Promise<void> {
    }
}
