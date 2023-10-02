import e from "express";
import { IRouteConventions } from "./routes/route.collection";
import { interfaces } from "inversify";
type ConfigHost = {
    port?: string;
};
export interface IApp {
    app: e.Application;
    conventions: IRouteConventions[];
    services: interfaces.Container;
    mapEndpoints: () => void;
    run: (config: ConfigHost) => void;
    useAuthentification: () => IApp;
    use: (callback: (app: IApp) => void) => IApp;
}
export {};
