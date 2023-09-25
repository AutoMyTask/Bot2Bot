import {IRouteConventions} from "./routes/endpoint.route.builder";
import {interfaces} from "inversify";
import e from "express";
import _ from "lodash";
import {AuthentificationBuilder} from "./auth/authentification.builder";
import {AllowAnonymousAttribute} from "./routes/metadata/AllowAnonymousAttribute";
import {AuthorizeAttribute} from "./routes/metadata/AuthorizeAttribute";

type ConfigHost = { port?: string }

export interface IApp {
    app: e.Application,
    conventions: IRouteConventions[],
    services: interfaces.Container,
    mapEndpoints: () => void
    run: (config: ConfigHost) => void
    useAuthentification: () => IApp
    use: (callback: (app: IApp) => void) => IApp
}

type UseAppCallback = ((app: IApp) => void)

export class App implements IApp {
    constructor(
        public readonly services: interfaces.Container,
        public readonly conventions: IRouteConventions[],
        public readonly app: e.Application
    ) {
    }

    run(config: ConfigHost): void {
        this.app.listen(config.port ?? 8000, () => {
            console.log(`Server started on port: http://localhost:${config.port ?? 8000}/docs`)
        })
    }

    useAuthentification(): IApp {
        if (this.services.isBound(AuthentificationBuilder)) {
            for (let convention of this.conventions) {
                const {handler, schemes} = this.services.get(AuthentificationBuilder)
                if (
                    (!convention.metadataCollection.items.some(item => item instanceof AllowAnonymousAttribute)
                    && convention.metadataCollection.items.some(item => item instanceof AuthorizeAttribute))
                    || !convention.metadataCollection.items.some(item => item instanceof AllowAnonymousAttribute)
                ) {
                    convention.middlewares.unshift(handler)
                    convention.auth = {schemes}
                }
            }
        }

        return this
    }

    use(callback: UseAppCallback): IApp {
        callback(this)
        return this
    }

    mapEndpoints(): void {
        // Pour les endpoints non groupé
        const conventionsWithNullPrefix = this.conventions.filter(convention => convention.prefixes.length === 0)
        const endpointRouters = this.createEndpointRouters(conventionsWithNullPrefix)
        this.app.use(endpointRouters)

        // Pour les endpoints groupé
        const conventionsWithOnePrefix = this.conventions.filter(convention => convention.prefixes.length === 1)
        for (let conventionWithOnePrefix of conventionsWithOnePrefix) {
            const firstPrefix = conventionWithOnePrefix.prefixes[0] // Regrouper les iroutesconventions ayant le même premier prefix commun / trouver un autre mecanisme
            const conventionsWithPrefix = this.conventions.filter(convention => convention.prefixes.includes(firstPrefix))
            const conventionsPrefixesSorted = conventionsWithPrefix
                .sort((a, b) => a.prefixes.length - b.prefixes.length)
            let prefixes: symbol[] = []
            const router = conventionsPrefixesSorted.reduce((router, convention, index, conventions) => {
                if (!_.isEqual(prefixes, convention.prefixes)) {
                    const endpointsConventions = conventions.filter(conventionFilter => _.isEqual(conventionFilter.prefixes, convention.prefixes))
                    const endpointRouters = this.createEndpointRouters(endpointsConventions)
                    const prefix = convention.prefixes[convention.prefixes.length - 1]
                    router.use(prefix?.description ?? '', convention.groupedMiddlewares, router, endpointRouters)
                    prefixes = convention.prefixes
                }
                return router
            }, e.Router())
            this.app.use(router)
        }
    }

    private createEndpointRouters(conventions: IRouteConventions[]): e.Router[] {
        return conventions.reduce((routers, convention) => {
            const router = e.Router()
            router[convention.method](
                convention.path,
                ...convention.middlewares,
                convention.handler
            )
            routers.push(router)
            return routers
        }, [] as e.Router[])
    }
}
