import axios, {AxiosInstance, AxiosResponse} from "axios";
import {inject, injectable, interfaces} from "inversify";
import {BadGatewayObject} from "../core/http/errors/BadGateway";
import {plainToInstance} from "class-transformer";


export type Auth = {
    payload: {
        iss: string,
        sub: string,
        aud: string[],
        iat: number,
        exp: number,
        azp: string,
        scope: string
    },
    header: { alg: string, typ: string, kid: string },
    token: string,
}

type Token = { access_token: string, scope: string, expires_in: number, token_type: string }

export type Identity = {
    provider: string,
    refresh_token: string,
    access_token: string,
    user_id: string,
    connection: string,
    isSocial: boolean
}


class User {
    public created_at!: string
    public email!: string
    public email_verified!: boolean
    public identities!: Identity[]
    public name!: string
    public nickname!: string
    public picture!: string

    getIdentityByConnection(connection: 'discord'): Identity | undefined {
        return this.identities.find(identity => identity.connection === connection)
    }
}

@injectable()
export class Auth0Service {
    public client: AxiosInstance
    private tokenEndpoint = 'https://dev-6s6s0f4wpurx7gmw.eu.auth0.com/oauth/token'
    private token?: Token & { timestamp: number }

    get isAccessTokenExpired() {
        return !this.token || Date.now() >= (this.token.expires_in * 1000 + this.token.timestamp)
    }


    constructor(
        @inject('auth0client_id') private clientId: string,
        @inject('auth0client_secret') private clientSecret: string,
        @inject('auth0_grant_type') private grandType: string,
        @inject('auth0_audience') private audience: string
    ) {
        this.client = axios.create({
            baseURL: 'https://dev-6s6s0f4wpurx7gmw.eu.auth0.com/api/v2',
        })
    }

    async getUser(id: string): Promise<User> {
        const request = () => this.client.get(`/users/${id}`)
        const {data} = await this.makeRequest(request)
        return plainToInstance(User, data)
    }

    async makeRequest(request: () => Promise<AxiosResponse<any>>): Promise<any> {
        if (this.isAccessTokenExpired) {
            await this.refreshToken()
        }
        return await request().catch(error => {
            console.error(error) // A ne pas enlever pour les logs
            throw new BadGatewayObject(
                'The API Management AUTH0 is not accessible or is not responding properly.',
                [
                    error.response.data.message
                ]
            )
        })
    }

    private async refreshToken(): Promise<void> {
        const {data} = await this.client.post(this.tokenEndpoint, {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            audience: this.audience,
            grant_type: this.grandType
        })
        this.client.defaults.headers.common['Authorization'] = `${data.token_type} ${data.access_token}`
        this.token = data
        this.token!.timestamp = Date.now()
    }

}

export const configureAuth0 = (
    clientId: string,
    clientSecret: string,
    grandType: string,
    audience: string
) => (services: interfaces.Container) => {
    services.bind('auth0client_id').toConstantValue(clientId)
    services.bind('auth0client_secret').toConstantValue(clientSecret)
    services.bind('auth0_grant_type').toConstantValue(grandType)
    services.bind('auth0_audience').toConstantValue(audience)
    services.bind(Auth0Service).to(Auth0Service).inSingletonScope()
}
