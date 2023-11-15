import e, { Application, Handler } from "express";
import _, { values } from "lodash";
import { AuthentificationBuilder } from "./auth/authentification.builder";
import { AllowAnonymousAttribute } from "./routes/metadata/AllowAnonymousAttribute";
import { AuthorizeAttribute } from "./routes/metadata/AuthorizeAttribute";
import {
  AppCore,
  IServiceCollection,
  RouteCore,
  TypesCore,
} from "api-core-types";
import { BaseRouteBuilder } from "./routes/base.route.builder";
import { EndpointRouteBuilder } from "./routes/endpoint.route.builder";
import { RequestHandlerBuilder } from "./request/request.handler.builder";
import { GroupedRouteBuilder } from "./routes/grouped.route.builder";
import express from "express";

export class App implements AppCore.IApp, RouteCore.IRouteMapBuilder {
  public readonly app: Application = express();
  public conventions: RouteCore.IRouteConventions[] = [];
  public readonly routesBuilders: BaseRouteBuilder[] = [];

  constructor(public readonly services: IServiceCollection) {
    this.app.use((req, res, next) => {
      req.services = this.services;
      next();
    });
  }

  run(config: AppCore.ConfigHost): void {
    this.app.listen(config.port ?? 8000, () => {
      console.log(
        `Server started on port: http://localhost:${config.port ?? 8000}/docs`,
      );
    });
  }

  addEndpoints(
    ...callbackEndpointBuilders: RouteCore.CallbackRouteMapBuilder<RouteCore.IRouteMapBuilder>[]
  ): AppCore.IApp {
    // Throw si deja fait. Indiquer que cet appel ne peut être exécuté qu'une seule fois
    // Pour éviter plein de this.buildEndpoint(). Si endpoints > 0 alors throw
    for (const callbackEndpointBuilder of callbackEndpointBuilders) {
      callbackEndpointBuilder(this);
    }

    this.buildEndpoint();

    return this;
  }

  use(callback: (app: AppCore.IApp) => void): AppCore.IApp {
    callback(this);
    return this;
  }

  useAuthentification(): AppCore.IApp {
    if (!this.services.isBound(AuthentificationBuilder)) {
      // Trouver un meilleur message d'erreur
      throw new Error("Veuillier configurer l'authentification");
    }

    for (let convention of this.conventions) {
      const mustAuthenticated =
        (!convention.metadataCollection.items.some(
          (item) => item instanceof AllowAnonymousAttribute,
        ) &&
          convention.metadataCollection.items.some(
            (item) => item instanceof AuthorizeAttribute,
          )) ||
        !convention.metadataCollection.items.some(
          (item) => item instanceof AllowAnonymousAttribute,
        );

      const { handler, schemes, onTokenValidated } = this.services.get(
        AuthentificationBuilder,
      );
      if (mustAuthenticated) {
        convention.middlewares.unshift(...[handler, onTokenValidated]);
        convention.auth = { schemes };
      }
    }

    return this;
  }

  private buildEndpoint(): AppCore.IApp {
    this.conventions = this.routesBuilders.reduce(
      (conventions, routeBuilder) => {
        conventions.push(...routeBuilder.buildRouteConventions());
        return conventions;
      },
      [] as RouteCore.IRouteConventions[],
    );
    return this;
  }

  mapEndpoints(): void {
    const conventionsWithNullPrefix = this.conventions.filter(
      (convention) => convention.prefixes.length === 0,
    );
    const endpointRouters = this.createEndpointRouters(
      conventionsWithNullPrefix,
    );
    if (endpointRouters.length > 0) {
      this.app.use(endpointRouters);
    }

    const conventionGroup = this.groupConventionsByPrefix();
    for (let conventions of values(conventionGroup)) {
      const conventionsPrefixesSorted = conventions.sort(
        (a, b) => a.prefixes.length - b.prefixes.length,
      );
      let prefixes: symbol[] = [];
      let count: number = 0;
      const router = conventionsPrefixesSorted.reduce(
        (router, convention, index, conventions) => {
          if (count !== convention.prefixes.length) {
            router.use(convention.prefixes[count]?.description ?? "", router);
            count = convention.prefixes.length;
          }
          if (!_.isEqual(prefixes, convention.prefixes)) {
            const endpointsConventions = conventions.filter(
              (conventionFilter) =>
                _.isEqual(conventionFilter.prefixes, convention.prefixes),
            );
            const endpointRouters =
              this.createEndpointRouters(endpointsConventions);
            const prefix = convention.prefixes[convention.prefixes.length - 1];
            router.use(prefix?.description ?? "", router, endpointRouters);
            prefixes = convention.prefixes;
          }
          return router;
        },
        e.Router(),
      );
      this.app.use(router);
    }
  }

  groupConventionsByPrefix(): {
    [prefix: string]: RouteCore.IRouteConventions[];
  } {
    const conventionsMap: { [prefix: string]: RouteCore.IRouteConventions[] } =
      {};
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
    return conventionsMap;
  }

  map(
    path: string,
    method: RouteCore.HTTPMethod,
    controllerType: TypesCore.New,
    controllerFunction: Function,
  ): RouteCore.IEndpointRouteBuilder {
    const endpointRouteBuilder = new EndpointRouteBuilder(
      new RequestHandlerBuilder(controllerType, controllerFunction),
      path,
      method,
    );

    this.routesBuilders.push(endpointRouteBuilder);
    return endpointRouteBuilder;
  }

  mapGroup(prefix: string): RouteCore.IGroupedEndpointRouteBuilder {
    const groupedRouteBuilder = new GroupedRouteBuilder(prefix, this);
    this.routesBuilders.push(groupedRouteBuilder);
    return groupedRouteBuilder;
  }

  private createEndpointRouters(
    conventions: RouteCore.IRouteConventions[],
  ): e.Router[] {
    return conventions.reduce((routers, convention) => {
      const router = e.Router();
      router[convention.method](
        convention.path,
        ...[...convention.middlewares, ...convention.request.handlers],
      );
      routers.push(router);
      return routers;
    }, [] as e.Router[]);
  }
}
