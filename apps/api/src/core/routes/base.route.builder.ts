import express, {RequestHandler} from "express";
import {MetadataCollection} from "./metadata.collection";
import {IRouteConventions} from "./single.route.builder";

export abstract class BaseRouteBuilder {
    protected middlewares: RequestHandler[] = []

    protected constructor(
        protected metadataCollection: MetadataCollection
    ) {
    }

    withMiddleware(middleware: RequestHandler): this {
        this.middlewares.push(middleware)
        return this
    }

    withMetadata(metadata: object): this {
        this.metadataCollection.push(metadata)
        return this;
    }

    abstract buildRouter(): express.Router

    abstract buildRouteConventions(): IRouteConventions[]
}
