import express, {Application} from "express";
import {Container} from "inversify";
import {AuthModule} from "./auth/auth.module";

export class App{
    public app: Application
    private readonly _container: Container

    constructor() {
        this.app = express()
        this._container = new Container()
        this.registerModules()
    }

    private registerModules(): void {
        const module = new AuthModule(this._container, this.app)
        module.register()
        module.mapAuthEndpoints()
    }
}

export default new App().app

