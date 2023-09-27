import express, {NextFunction, RequestHandler} from "express";
import {MetadataCollection} from "./metadata.collection";
import {IEndpointRouteBuilder, IRouteConventions} from "./endpoint.route.builder";
import {AllowAnonymousAttribute} from "./metadata/AllowAnonymousAttribute";
import {AuthorizeAttribute} from "./metadata/AuthorizeAttribute";
import {extend} from "lodash";



export abstract class BaseRouteBuilder {
    public middlewares: RequestHandler[] = []
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

    withMiddleware(middleware: RequestHandler): this {
        this.middlewares.push(middleware)
        return this
    }

    withMetadata(...metadata: object[]): this {
        this.metadataCollection.push(...metadata)
        return this;
    }

    abstract buildRouteConventions(): IRouteConventions[]
}
