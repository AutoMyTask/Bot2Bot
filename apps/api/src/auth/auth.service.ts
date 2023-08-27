import {IAuthService} from "./IAuthService";
import {injectable} from 'inversify'
import "reflect-metadata"

@injectable()
export class AuthService implements IAuthService {
    async getAuth(): Promise<void> {
    }
}
