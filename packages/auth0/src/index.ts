import axios, { AxiosInstance, AxiosResponse } from "axios";
import { inject, injectable, interfaces } from "inversify";
import { UserService } from "./users/user.service";

export type Auth = {
  payload: {
    iss?: string;
    sub?: string;
    aud?: string | string[];
    jti?: string;
    nbf?: number;
    exp?: number;
    iat?: number;
    [propName: string]: unknown;
  };
  header: {
    alg?: string;
    b64?: boolean;
    crit?: string[];
    [propName: string]: unknown;
  };
  token: string;
};

type Token = {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
};

export type Identity = {
  provider: string;
  refresh_token: string;
  access_token: string;
  user_id: string;
  connection: string;
  isSocial: boolean;
};

@injectable()
export class Auth0Service {
  public client: AxiosInstance;
  private tokenEndpoint =
    "https://dev-6s6s0f4wpurx7gmw.eu.auth0.com/oauth/token"; // Passer le domaine dans une variable
  private token?: Token & { timestamp: number };
  public readonly user: UserService = new UserService(this);

  constructor(
    @inject("auth0client_id") private clientId: string,
    @inject("auth0client_secret") private clientSecret: string,
    @inject("auth0_audience") private audience: string,
  ) {
    this.client = axios.create({
      baseURL: "https://dev-6s6s0f4wpurx7gmw.eu.auth0.com/api/v2", // valeur ne devant pas être inséré en dure (le domaine)
    });
  }

  get isAccessTokenExpired() {
    return (
      !this.token ||
      Date.now() >= this.token.expires_in * 1000 + this.token.timestamp
    );
  }

  async makeRequest(request: () => Promise<AxiosResponse<any>>): Promise<any> {
    if (this.isAccessTokenExpired) {
      await this.login(); // Normalement je suis censé refresh....
    }
    return await request();
  }

  public async login(): Promise<void> {
    const { data }: { data: Token } = await this.client.post(
      this.tokenEndpoint,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: this.audience,
        grant_type: "client_credentials",
      },
    );
    this.client.defaults.headers.common[
      "Authorization"
    ] = `${data.token_type} ${data.access_token}`;
    this.token = { ...data, timestamp: Date.now() };
  }
}

export const configureAuth0 =
  (clientId: string, clientSecret: string, audience: string) =>
  (services: interfaces.Container) => {
    services.bind("auth0client_id").toConstantValue(clientId);
    services.bind("auth0client_secret").toConstantValue(clientSecret);
    services.bind("auth0_audience").toConstantValue(audience);
    services.bind(Auth0Service).toSelf();
  };
