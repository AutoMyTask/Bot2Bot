import {Application} from "express"
import {Container} from "inversify"
import {AuthModule} from "./auth/auth.module"
import {Model} from 'objection'
import {knex} from "./database/knex"
// import start from 'bot-music';
import {Endpoints} from "./endpoints"
import container from "./container"

export class App {
    private readonly container: Container =  container
    private readonly _endpoints: Endpoints = this.container.get(Endpoints)
    public app: Application = this.container.get('Application')

    constructor() {
        this.configure()
        this.registerModules()
    }

    public async startBots() {
        await start();
    }

    private configure(): void {
        Model.knex(knex)
    }

    private registerModules(): void {
        const module = container.get(AuthModule)
        module.mapAuthEndpoints()
    }
}

export default new App()

