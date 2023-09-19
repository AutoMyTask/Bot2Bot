import {injectable} from 'inversify'
import "reflect-metadata"


@injectable()
export class AuthService {
    async getAuth(): Promise<number> {
        return 0
    }
}
