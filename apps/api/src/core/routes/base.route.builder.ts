import express, {RequestHandler} from "express";
import {MetadataCollection} from "./metadata.collection";
import {IRouteConventions} from "./endpoint.route.builder";


export abstract class BaseRouteBuilder {
    public middlewares: RequestHandler[] = []

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
