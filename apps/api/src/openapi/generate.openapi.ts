import {
    IRequestHandlerConventions,
    IRouteMapBuilder
} from "../app.builder";
import {OpenApiBuilder, ReferenceObject, SchemaObject, } from "openapi3-ts/oas31";
import {createPathItem} from "./create.path";
import {createRequestBody} from "./create.requestBody";
import {createSchema} from "./create.schema";
import {MetadataTag} from "./metadata/metadataTag";
import {MetadataProduce, Schema} from "./metadata/metadataProduce";
import {createResponseObject} from "./create.responseObject";


/**
 * MODULE OPENAPI
 * J'utiliserai toute les metadata que je peux enregister dans les metadonnées
 * Autrement je passerai pas des décorateurs
 */
// https://blog.simonireilly.com/posts/typescript-openapi

type GroupedMetadataSchema = {
    name: string;
    schema: ReferenceObject | SchemaObject;
};
type GroupedMetadataTag = {
    name: string;
    tag: MetadataTag;
};


function processRouteHandlers(
    routeMapBuilder: IRouteMapBuilder,
    requestsHandlersConvention: IRequestHandlerConventions[]
) {
    const groupedMetadataTagCollection = new Map<string, GroupedMetadataTag>()
    const groupedMetadataSchemaCollection = new Map<string, GroupedMetadataSchema>()

    for (const {
        params,
        fullPath,
        method,
        body,
        metadataCollection,
        auth
    } of requestsHandlersConvention) {
        const metadataTags = metadataCollection.getAllMetadataAttributes(MetadataTag)

        const metadataProduces = metadataCollection
            .getAllMetadataAttributes(MetadataProduce)

        const schemas = metadataProduces.reduce(
                (schemas, metadata) => [...schemas, ...metadata.schemas, metadata.schema],
                [] as Schema[])

        for (const {type, schema} of schemas) {
            if (!groupedMetadataSchemaCollection.has(type.name)) {
                groupedMetadataSchemaCollection.set(type.name, {
                    name: type.name,
                    schema,
                });
            }
        }

        for (const metadataTag of metadataTags) {
            if (!groupedMetadataTagCollection.has(metadataTag.name)) {
                groupedMetadataTagCollection.set(metadataTag.name, {
                    name: metadataTag.name,
                    tag: metadataTag,
                });
            }
        }

        const pathItem = createPathItem(
            params,
            method,
            metadataTags,
            metadataProduces,
            auth?.schemes,
            body
        );

        const path = fullPath.replace(/:([^}]*)/g, '{$1}');

        const openApiBuilder = routeMapBuilder.services.get<OpenApiBuilder>(
            OpenApiBuilder
        );

        openApiBuilder.addPath(path, pathItem);

        if (body) {
            groupedMetadataSchemaCollection.set(body.name, {
                name: body.name,
                schema: createSchema(body),
            });
            const reqBody = createRequestBody(body);
            openApiBuilder.addRequestBody(body.name, reqBody);
        }

        for (const metadataProduce of metadataProduces) {
            const responseObject = createResponseObject(metadataProduce);
            openApiBuilder.addResponse(metadataProduce.type.name, responseObject);
        }
    }

    return {groupedMetadataTagCollection, groupedMetadataSchemaCollection}
}


export const generateOpenApi = (
    routeMapBuilder: IRouteMapBuilder
): void => {

    const requestsHandlersConvention = routeMapBuilder.baseRouteBuilders.reduce(
        (
            requestsHandlersConvention,
            basRouteBuilder
        ) => [...requestsHandlersConvention, ...basRouteBuilder.buildRouteHandlers()],
        [] as IRequestHandlerConventions[]
    );

    const {
        groupedMetadataTagCollection,
        groupedMetadataSchemaCollection,
    } = processRouteHandlers(routeMapBuilder, requestsHandlersConvention);



    const openApiBuilder = routeMapBuilder.services.get<OpenApiBuilder>(
        OpenApiBuilder
    );

    for (const metadataTag of groupedMetadataTagCollection.values()) {
        openApiBuilder.addTag(metadataTag.tag.tagObject)
    }

    for (const metadataScheme of groupedMetadataSchemaCollection.values()) {
        openApiBuilder.addSchema(metadataScheme.name, metadataScheme.schema)
    }

}
