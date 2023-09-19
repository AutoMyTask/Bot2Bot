import {inject, injectable} from "inversify";
import {RequestHandler} from "express";
import 'reflect-metadata'

export type SecurityType = 'bearer' | 'oauth2'

@injectable()
export class AuthentificationBuilder {
    constructor(
        @inject('HandlerAuthentification') public readonly handler: RequestHandler,
        @inject('Schemes') public readonly schemes: SecurityType[],
    ) {
    }
}
