import {inject, injectable} from "inversify";
import {Handler, RequestHandler} from "express";
import 'reflect-metadata'
import {Auth} from "api-core-types";


@injectable()
export class AuthentificationBuilder implements Auth.IAuthentificationBuilder {
    public onTokenValidated: Handler = (req, res, next) => {
        next()
    }

    constructor(
        @inject('HandlerAuthentification') public readonly handler: RequestHandler,
        @inject('Schemes') public readonly schemes: Auth.SecurityType[],
    ) {
    }
}
