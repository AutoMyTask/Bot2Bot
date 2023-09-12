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
import _ from "lodash";
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
        .get<OpenApiBuilder>('OpenApiBuilder')

    const groupedMetadataTagCollection = new Set<MetadataTag>();
    const metadataSchemaCollection = new Set<{ name: string, schema: ReferenceObject | SchemaObject }>()

    const requestsHandlersConvention = routeMapBuilder.dataSources.reduce((requestsHandlersConvention, dataSource) => {
        return [...requestsHandlersConvention, ...dataSource.getHandlers()]
    }, [] as IRequestHandlerConventions[])

    for (const {params, fullPath, method, body, metadataCollection} of requestsHandlersConvention) {
        const metadataTags = metadataCollection.getAllMetadataAttributes(MetadataTag)
        const metadataProduces = metadataCollection.getAllMetadataAttributes(MetadataProduce)

        for (let {type, schema} of metadataProduces) {
            metadataSchemaCollection.add({name: type.name, schema})
        }
        for (let metadataTag of metadataTags) {
            groupedMetadataTagCollection.add(metadataTag)
        }

        const pathItem = createPathItem(params, method, metadataTags, metadataProduces, body)
        const path = fullPath.replace(/:([^}]*)/g, '{$1}')
        openApiBuilder.addPath(path, pathItem)

        if (!_.isEmpty(body)) {
            metadataSchemaCollection.add({name: body.constructor.name, schema: createSchema(body)})
            const reqBody = createRequestBody(body)
            openApiBuilder.addRequestBody(body.constructor.name, reqBody)
        }

        for (const metadataProduce of metadataProduces) {
            const responseObject = createResponseObject(metadataProduce)
            openApiBuilder.addResponse(metadataProduce.type.name, responseObject)
        }
    }

    for (const metadataTag of groupedMetadataTagCollection) {
        openApiBuilder.addTag(metadataTag.tagObject)
    }

    for (const metadataScheme of metadataSchemaCollection) {
        openApiBuilder.addSchema(metadataScheme.name, metadataScheme.schema)
    }

}
