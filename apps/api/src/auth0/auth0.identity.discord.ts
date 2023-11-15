import { inject, injectable, interfaces } from "inversify";
import { Auth0Service } from "auth0";
import { DiscordService, User } from "discord";
import { TestFile } from "../tests/utils/test.file";
import { isEqual } from "lodash";

// Cette classe serra supprimer. Privilégier les routes '/discord/@me' et tout séparer
@injectable()
export class Auth0IdentityDiscord {
  private sub?: string;

  constructor(
    @inject(Auth0Service) private auth0Service: Auth0Service,
    @inject(DiscordService) private discordService: DiscordService,
  ) {}

  public setSub(sub: string) {
    this.sub = sub;
  }

  get hasSub() {
    return this.sub !== undefined;
  }

  async getUser(): Promise<User> {
    const request = () => this.discordService.user.getUser();
    return await this.makeRequest(request);
  }

  async makeRequest(request: () => Promise<any>): Promise<any> {
    if (!this.sub) {
      throw new Error("Un erreur");
    }

    const testFile = new TestFile("auth0.identity.discord");

    if (process.env.NODE_ENV === "test" && testFile.fileExist()) {
      this.discordService.setToken(testFile.value);
    }

    if (!this.discordService.hasToken) {
      const userAuth0 = await this.auth0Service.user.getUser(this.sub);

      const discordIdentity = userAuth0.getIdentityByConnection("discord");

      if (!discordIdentity) {
        throw new Error("trouver un message approprié");
      }

      const { refresh_token, access_token } = discordIdentity;

      this.discordService.setToken({
        access_token,
        refresh_token,
        token_type: "Bearer",
      });
    }

    const response = await request();

    if (
      process.env.NODE_ENV === "test" &&
      (!testFile.fileExist() ||
        !isEqual(testFile.value, this.discordService.getToken()))
    ) {
      testFile.generateTestFile(this.discordService.getToken());
    }

    return response;
  }
}

export const configureAuth0IdentityDiscord = (
  services: interfaces.Container,
) => {
  services.bind(Auth0IdentityDiscord).toSelf().inSingletonScope();
};
