import {Handler} from "express";
import {MetadataCollection} from "./metadata.collection";
import {AllowAnonymousAttribute} from "./metadata/AllowAnonymousAttribute";
import {AuthorizeAttribute} from "./metadata/AuthorizeAttribute";
import {RouteCore} from "api-core-types";


export abstract class BaseRouteBuilder implements RouteCore.IBaseRouteBuilder{
    public middlewares: Handler[] = []
    protected metadataCollection: MetadataCollection = new MetadataCollection()

    requireAuthorization(): this {
        this.metadataCollection.items = this.metadataCollection.items.filter(item => !(item instanceof AllowAnonymousAttribute))
        this.metadataCollection.push(new AuthorizeAttribute())
        return this
    }

    allowAnonymous(): this {
        this.metadataCollection.items = this.metadataCollection.items.filter(item => !(item instanceof AuthorizeAttribute))
        this.metadataCollection.push(new AllowAnonymousAttribute())
        return this
    }

    withMiddleware(middleware: Handler): this {
        this.middlewares.push(middleware)
        return this
    }

    withMetadata(...metadata: object[]): this {
        this.metadataCollection.push(...metadata)
        return this;
    }

    abstract buildRouteConventions(): RouteCore.IRouteConventions[]
}
