import e from "express";
import _, {values} from "lodash";
import {AuthentificationBuilder} from "./auth/authentification.builder";
import {AllowAnonymousAttribute} from "./routes/metadata/AllowAnonymousAttribute";
import {AuthorizeAttribute} from "./routes/metadata/AuthorizeAttribute";
import {AppCore, IServiceCollection, RouteCore} from "core-types";


export class App implements AppCore.IApp {
    constructor(
        public readonly services: IServiceCollection,
        public readonly conventions: RouteCore.IRouteConventions[],
        public readonly app: e.Application
    ) {
    }

    run(config: AppCore.ConfigHost): void {
        this.app.listen(config.port ?? 8000, () => {
            console.log(`Server started on port: http://localhost:${config.port ?? 8000}/docs`)
        })
    }

    useAuthentification(): AppCore.IApp {
        for (let convention of this.conventions) {
            const mustAuthenticated = (!convention.metadataCollection.items.some(item => item instanceof AllowAnonymousAttribute)
                    && convention.metadataCollection.items.some(item => item instanceof AuthorizeAttribute))
                || !convention.metadataCollection.items.some(item => item instanceof AllowAnonymousAttribute)

            if (!this.services.isBound(AuthentificationBuilder) && mustAuthenticated) {
                // Trouver un meilleur message d'erreur
                throw new Error("Veuillier configurer l'authentification")
            }

            const {handler, schemes} = this.services.get(AuthentificationBuilder)
            if (mustAuthenticated) {
                convention.middlewares.unshift(handler)
                convention.auth = {schemes}
            }
        }

        return this
    }

    use(callback: AppCore.UseAppCallback): AppCore.IApp {
        callback(this)
        return this
    }

    mapEndpoints(): void {
        const conventionsWithNullPrefix = this.conventions.filter(convention => convention.prefixes.length === 0)
        const endpointRouters = this.createEndpointRouters(conventionsWithNullPrefix)
        if (endpointRouters.length > 0){
            this.app.use(endpointRouters)
        }

        const conventionGroup = this.groupConventionsByPrefix()
        for (let conventions of values(conventionGroup)) {
            const conventionsPrefixesSorted = conventions
                .sort((a, b) => a.prefixes.length - b.prefixes.length)
            let prefixes: symbol[] = []
            let count: number = 0
            const router = conventionsPrefixesSorted.reduce((router, convention, index, conventions) => {
                if (count !== convention.prefixes.length){
                    router.use(convention.prefixes[count]?.description ?? '', router)
                    count = convention.prefixes.length
                }
                if (!_.isEqual(prefixes, convention.prefixes)) {
                    const endpointsConventions = conventions.filter(conventionFilter => _.isEqual(conventionFilter.prefixes, convention.prefixes))
                    const endpointRouters = this.createEndpointRouters(endpointsConventions)
                    const prefix = convention.prefixes[convention.prefixes.length - 1]
                    router.use(prefix?.description ?? '', router, endpointRouters)
                    prefixes = convention.prefixes
                }
                return router
            }, e.Router())
            this.app.use(router)
        }
    }

    groupConventionsByPrefix(): { [prefix: string]: RouteCore.IRouteConventions[] } {
        const conventionsMap: { [prefix: string]: RouteCore.IRouteConventions[] } = {};
        for (const convention of this.conventions) {
            const prefixes = convention.prefixes;

            if (prefixes.length > 0) {
                const firstPrefix = prefixes[0].description;

                if (!conventionsMap[firstPrefix!]) {
                    conventionsMap[firstPrefix!] = [];
                }

                conventionsMap[firstPrefix!].push(convention);
            }
        }
        return conventionsMap
    }

    private createEndpointRouters(conventions: RouteCore.IRouteConventions[]): e.Router[] {
        return conventions.reduce((routers, convention) => {
            const router = e.Router()
            router[convention.method](
                convention.path,
                ...[...convention.middlewares, convention.requestHandler.argsHandler],
                convention.requestHandler.finalHandler
            )
            routers.push(router)
            return routers
        }, [] as e.Router[])
    }
}
