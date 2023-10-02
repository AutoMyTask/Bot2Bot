import axios from "axios";
import {AxiosInstance, AxiosResponse} from "axios/index";
import {inject, injectable, interfaces} from "inversify";
import {BadGatewayObject} from "../core/http/errors/BadGateway";
import {Auth0Service} from "../auth0/auth0.service";

export interface User {
    id: string,
    username: string,
    avatar: null | string,
    discriminator: string,
    public_flags: number | null,
    flags: number | null,
    global_name: string | null,
    banner: null | string,
    accent_color: null | number,
    avatar_decoration_data: null | string,
    banner_color: null | string,
    mfa_enabled: boolean | null,
    locale: string | null,
    premium_type: number | null,
    email: string | null,
    verified: boolean | null
}

@injectable()
export class DiscordService {
    public client: AxiosInstance

    constructor(
        @inject(Auth0Service) private auth0Service: Auth0Service
    ) {
        this.client = axios.create({
            baseURL: 'https://discord.com/api'
        })
    }


    async getGuilds(sub: string){

    }

    async getUser(sub: string): Promise<User> {
        const request = () => this.client.get('/users/@me')
        const {data} = await this.makeRequest(request, sub)

        return data
    }
    private async makeRequest(request: () => Promise<AxiosResponse<any>>, sub: string): Promise<any> {
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

