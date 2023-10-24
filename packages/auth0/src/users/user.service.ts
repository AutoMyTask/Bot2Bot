import {Auth0Service} from "../index";
import {User} from "./user";
import {plainToInstance} from "class-transformer";

export class UserService {
    constructor(private auth0Service: Auth0Service) {
    }

    async getUser(id: string): Promise<User> {
        const request = () => this.auth0Service.client.get(`/users/${id}`)
        const {data} = await this.auth0Service.makeRequest(request)
        return plainToInstance(User, data)
    }
}
