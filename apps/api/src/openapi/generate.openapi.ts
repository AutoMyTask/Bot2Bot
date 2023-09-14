import {
    IRequestHandlerConventions,
    IRouteMapBuilder
} from "../app.builder";
import {OpenApiBuilder, ReferenceObject, SchemaObject} from "openapi3-ts/oas31";
import {createPathItem} from "./create.path";
import {createRequestBody} from "./create.requestBody";
import {createSchema} from "./create.schema";
import {MetadataTag} from "./metadata/metadataTag";
import {MetadataProduce} from "./metadata/metadataProduce";
import {createResponseObject} from "./create.responseObject";

/**
 * MODULE OPENAPI
 * J'utiliserai toute les metadata que je peux enregister dans les metadonnées
 * Autrement je passerai pas des décorateurs
 */
// https://blog.simonireilly.com/posts/typescript-openapi


export const generateOpenApi = (
    routeMapBuilder: IRouteMapBuilder
): void => {
    const openApiBuilder = routeMapBuilder.services
        .get<OpenApiBuilder>(OpenApiBuilder)

    const groupedMetadataTagCollection = new Map<string,MetadataTag>();
    const groupedMetadataSchemaCollection = new Map<string, { name: string, schema: ReferenceObject | SchemaObject }>()

    const requestsHandlersConvention = routeMapBuilder.baseRouteBuilders.reduce((
        requestsHandlersConvention,
        basRouteBuilder
    ) => {
        return [...requestsHandlersConvention, ...basRouteBuilder.buildRouteHandlers()]
    }, [] as IRequestHandlerConventions[])

    for (const {params, fullPath, method, body, metadataCollection} of requestsHandlersConvention) {
        const metadataTags = metadataCollection.getAllMetadataAttributes(MetadataTag)
        const metadataProduces = metadataCollection.getAllMetadataAttributes(MetadataProduce)
            .map(metadata => metadata.schemas.flat() ).flat()


        for (let {type, schema} of metadataProduces) {
            if (!groupedMetadataSchemaCollection.has(type.name)){
                groupedMetadataSchemaCollection.set(type.name ,{name: type.name, schema})
            }
        }
        for (let metadataTag of metadataTags) {
            if (!groupedMetadataTagCollection.has(metadataTag.name)){
                groupedMetadataTagCollection.set(metadataTag.name, metadataTag)
            }
        }

        const pathItem = createPathItem(params, method, metadataTags, metadataProduces, body)
        const path = fullPath.replace(/:([^}]*)/g, '{$1}')
        openApiBuilder.addPath(path, pathItem)

        if (body) {
            groupedMetadataSchemaCollection.set(body.name,{name: body.name, schema: createSchema(body)})
            const reqBody = createRequestBody(body)
            openApiBuilder.addRequestBody(body.name, reqBody)
        }

        for (const metadataProduce of metadataProduces) {
            const responseObject = createResponseObject(metadataProduce)
            openApiBuilder.addResponse(metadataProduce.type.name, responseObject)
        }
    }

    for (const metadataTag of groupedMetadataTagCollection.values()) {
        openApiBuilder.addTag(metadataTag.tagObject)
    }

    for (const metadataScheme of groupedMetadataSchemaCollection.values()) {
        openApiBuilder.addSchema(metadataScheme.name, metadataScheme.schema)
    }

}
