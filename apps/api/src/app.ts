import express, {Application} from "express";
import {Container} from "inversify";
import {AuthModule} from "./auth/auth.module";
import cors from './middlewares/cors';
import {rateLimiter} from "./middlewares/rate.limiter";
import helmet from "helmet";
import {Model} from 'objection';
import {knex} from "./database/knex";
// import start from 'bot-music';
import {Endpoints} from "./endpoints";
import container from "./container";
import {errorHandler} from "./middlewares/error.handler";
import {logError} from "./middlewares/log.error";

export class App {
    private readonly container: Container =  container
    private readonly _endpoints: Endpoints = this.container.get(Endpoints)
    public app: Application = this.container.get('Application')

    constructor() {
        this.configure()
        this.registerModules()
        this.createSwagger()
        this.setupErrorHandler()
    }

    public async startBots() {
        // await start();
    }

    private configure(): void {
        this.app.use(express.json())
        this.app.use(express.urlencoded({extended: true}))
        this.app.use(rateLimiter)
        this.app.use(cors)
        this.app.use(helmet())
        Model.knex(knex)
    }

    private registerModules(): void {
        const module = container.get(AuthModule)
        module.mapAuthEndpoints()
    }

    private createSwagger(): void {
        this._endpoints.setupSwaggerRoute()
    }

    private setupErrorHandler(){
        this.app.use(logError)
        this.app.use(errorHandler)
    }
}

export default new App()

