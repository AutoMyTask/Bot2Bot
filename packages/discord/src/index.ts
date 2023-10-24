import axios, {AxiosError} from "axios";
import {AxiosInstance, AxiosResponse} from "axios";
import {inject, injectable} from "inversify";
import {UserManager} from "./users/user.manager";
import {Oauth2Manager} from "./oauth2/oauth2.manager";
import {BadRequest, IServiceCollection} from "api-core-types";
import {HttpError} from "http-errors";

type Token = {
    access_token?: string,
    token_type?: string,
    expires_in?: number,
    refresh_token?: string,
    scope?: string,
    timestamp?: number

}

@injectable()
export class DiscordService {
    private token?: Token

    public client: AxiosInstance = axios.create({
        baseURL: 'https://discord.com/api/v10'
    })
    public user: UserManager = new UserManager(this)
    public oauth2: Oauth2Manager = new Oauth2Manager(this)

    constructor(
        @inject('discordClient_id') public clientId: string,
        @inject('discordClient_secret') public clientSecret: string
    ) {
    }

    public async makeRequest(request: () => Promise<AxiosResponse<any>>): Promise<any> {
        if (!this.hasToken) {
            throw new Error('Error: Please log in or set an access_token.')
        }

        // A voir pour la conditions
        if (!this.token?.timestamp || !this.token?.expires_in || !this.isAccessTokenExpired) {
            await this.refresh().catch(async (err) => {
                throw await this.handleErrorResponse(err)
            })
        }

        this.updateAuthorizationHeader();

        return await request().catch(async (err) => {
            throw await this.handleErrorResponse(err)
        })
    }

    private handleErrorResponse(error: AxiosError): Promise<HttpError> {
        const normaliseError = new AxiosError()

        if (error.response){

            if (error.response.status === 400) {
                const data: any = error.response?.data
                return Promise.reject(new BadRequest([data.error], 'In Discord API Error'))
            }

        } else if (error.request){

        }

        // retourne internelError....

        return Promise.reject(normaliseError)
    }

    private updateAuthorizationHeader() {
        const token = `${this.token!.token_type} ${this.token!.access_token}`
        if (
            this.client.defaults.headers.common['Authorization'] === undefined
            || this.client.defaults.headers.common['Authorization'] !== token
        ) {
            this.client.defaults.headers.common['Authorization'] = token
        }
    }

    get isAccessTokenExpired() {
        if (!this.token?.timestamp && !this.token?.expires_in) {
            throw new Error('Error: Timestamp and expires_in of the token not set.');
        }

        return Date.now() >= (this.token!.expires_in! * 1000 + this.token.timestamp!)
    }

    public get hasToken(): boolean {
        return this.token !== undefined
            && this.token.refresh_token !== undefined
            && this.token.access_token !== undefined
            && this.token.token_type !== undefined
    }

    public setToken(token: { access_token: string, refresh_token: string, token_type: string }) {
        this.token = token
    }

    private async refresh() {
        if (!this.token?.refresh_token) {
            throw new Error('Error: The refresh token must be set.');
        }

        const urlSearchParams = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.token.refresh_token,
        })

        const {data} = await this.client.post(`/oauth2/token`, urlSearchParams.toString(), {
            headers: {
                "Content-Type": 'application/x-www-form-urlencoded'
            },
            auth: {
                username: this.clientId,
                password: this.clientSecret
            }
        })

        this.setToken(data)
        this.token!.timestamp = Date.now()
    }
}

export const configureDiscord = (
    clientId: string,
    clientSecret: string
) => (services: IServiceCollection,) => {
    services.bind(DiscordService).toSelf()
    services.bind('discordClient_id').toConstantValue(clientId)
    services.bind('discordClient_secret').toConstantValue(clientSecret)
}

export {User} from './users/user'
