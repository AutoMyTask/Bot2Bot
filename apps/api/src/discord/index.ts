import axios from "axios";
import {AxiosInstance, AxiosResponse} from "axios";
import {inject, injectable, interfaces} from "inversify";
import {BadGatewayObject} from "../core/http/errors/BadGateway";
import {Auth0Service} from "../auth0/auth0.service";
import {UserManagement} from "./users/user.management";

@injectable()
export class DiscordService {
    public client: AxiosInstance
    public user: UserManagement

    constructor(
        @inject(Auth0Service) private auth0Service: Auth0Service
    ) {
        this.client = axios.create({
            baseURL: 'https://discord.com/api'
        })

        this.user = new UserManagement(this)
    }

    public async makeRequest(request: () => Promise<AxiosResponse<any>>, sub: string): Promise<any> {
        if (!this.hasToken){
            const userAuth0 = await this.auth0Service.getUser(sub)
            const discordIdentity = userAuth0.getIdentityByConnection('discord')

            if (!discordIdentity){
                throw new Error('trouver un message approprié')
            }

            this.setToken(discordIdentity.access_token)
        }
        return await request().catch(error => {
            console.error(error) // A ne pas enlever pour les logs
            throw new BadGatewayObject(
                'The API discord is not accessible or is not responding properly.',
                [
                    error.response.data.message
                ]
            )
        })
    }

    private get hasToken(){
        return this.client.defaults.headers.common['Authorization'] !== undefined
    }

    private setToken(accessToken: string): void {
        this.client.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken
    }
}

export const configureDiscord = (services: interfaces.Container) => {
    services.bind(DiscordService).toSelf()
}

