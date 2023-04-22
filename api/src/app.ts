import express, {Application} from "express";
import {Container} from "inversify";
import {AuthModule} from "./auth/auth.module";
import cors from './middlewares/cors';
import {rateLimiter} from "./middlewares/rate-limiter";
import helmet from "helmet";

export class App {
    public app: Application
    private readonly _container: Container

    constructor() {
        this.app = express()
        this._container = new Container()
        this.configure()
        this.registerModules()
    }

    private configure(): void{
        this.app.use(express.json())
        this.app.use(express.urlencoded())
        this.app.use(rateLimiter)
        this.app.use(cors)
        this.app.use(helmet())
    }

    private registerModules(): void {
        const module = new AuthModule(this._container, this.app)
        module.register()
        module.mapAuthEndpoints()
    }
}

export default new App().app

