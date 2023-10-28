import {inject, injectable, interfaces} from "inversify";
import {Auth0Service} from "auth0";
import {DiscordService, User} from "discord";
import {TestFile} from "../tests/utils/test.file";

@injectable()
export class Auth0DiscordService {
    private sub?: string

    constructor(
        @inject(Auth0Service) private auth0Service: Auth0Service,
        @inject(DiscordService) private discordService: DiscordService
    ) {
    }

    public setSub(sub: string) {
        this.sub = sub
    }

    get hasSub() {
        return this.sub !== undefined
    }

    async getUser(): Promise<User> {
        const request = () => this.discordService.user.getUser()
        return await this.makeRequest(request)
    }

    async makeRequest(request: () => Promise<any>): Promise<any> {
        if (!this.sub) {
            throw new Error('Un erreur')
        }

        const testFile = new TestFile('identity.discord')

        if (!this.discordService.hasToken) {

            // Si environnement de test, et si un fichier identity.discord.json existe je set le token avec le fichier (comme une continuité de service)

            const userAuth0 = await this.auth0Service.user.getUser(this.sub)

            const discordIdentity = userAuth0.getIdentityByConnection('discord')

            if (!discordIdentity) {
                throw new Error('trouver un message approprié')
            }

            const {refresh_token, access_token} = discordIdentity


            this.discordService.setToken({access_token, refresh_token, token_type: 'Bearer'})
        }


        const response = await request()

        // Je génére le fichier uniquement si environnement de test et que le file n'a pas encore été créée
        testFile.generateTestFile(this.discordService.getToken())

        return response
    }
}


export const configureAuth0DiscordService = (services: interfaces.Container) => {
    services.bind(Auth0DiscordService).toSelf().inSingletonScope()
}
