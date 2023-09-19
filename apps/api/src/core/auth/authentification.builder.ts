import {inject, injectable} from "inversify";
import {RequestHandler} from "express";
import {SecurityType} from "./types";

@injectable()
export class AuthentificationBuilder {
    constructor(
        @inject('HandlerAuthentification') public readonly handler: RequestHandler,
        @inject('Schemes') public readonly schemes: SecurityType[],
    ) {
    }
}
