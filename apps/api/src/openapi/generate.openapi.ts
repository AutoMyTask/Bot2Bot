import {
    EndpointDataSource,
    IGroupeRouteHandlerConventions, instanceOfIGroupeRouteHandlerConventions, instanceOfIRouteHandlerConventions,
    IRequestHandlerConventions,
    IRouteMapBuilder
} from "../app.builder";
import {OpenApiBuilder, ReferenceObject, SchemaObject} from "openapi3-ts/oas31";
import {createPathItem} from "./create.path";
import {isEmpty} from "radash";
import {createRequestBody} from "./create.requestBody";
import {createSchema} from "./create.schema";
import {MetadataTag} from "./metadata/metadataTag";
import {MetadataProduce} from "./metadata/metadataProduce";

export const generateOpenApi = (
    routeMapBuilder: IRouteMapBuilder
): void => {
    const groupedMetadataTagCollection = new Set<MetadataTag>();
    const metadataSchemaCollection = new Set<{ name: string, schema: ReferenceObject | SchemaObject }>()

    const openApiBuilder = routeMapBuilder.services
        .get<OpenApiBuilder>('OpenApiBuilder')

    function iterateRequestHandlerConventions(requestHandlerConventions: IRequestHandlerConventions[]): void {
        for (const {params, fullPath, method, body, metadataCollection} of requestHandlerConventions) {
            const metadataTags = metadataCollection.getAllMetadataAttributes(MetadataTag)
            const metadataProduces = metadataCollection.getAllMetadataAttributes(MetadataProduce)

            for (let { type, schema } of metadataProduces) {
                metadataSchemaCollection.add({ name: type.name, schema: schema })
            }
            for (let metadataTag of metadataTags) {
                groupedMetadataTagCollection.add(metadataTag)
            }


            const tags = metadataTags.map(metadataTag => metadataTag.name)
            const path = fullPath.replace(/:([^}]*)/g, '{$1}')
            const pathItem = createPathItem(params, method, body, tags)
            openApiBuilder.addPath(path, pathItem)

            if (!isEmpty(body)) {
                metadataSchemaCollection.add({ name: body.constructor.name, schema: createSchema(body) })
                const reqBody = createRequestBody(body)
                openApiBuilder.addRequestBody(body.constructor.name, reqBody)
            }
        }
    }

    function iterateGroup({routesHandlersConventions, subGroups, metadataCollection}: IGroupeRouteHandlerConventions) {

        const metadataTags = metadataCollection.getAllMetadataAttributes(MetadataTag)
        for (let metadataTag of metadataTags) {
            groupedMetadataTagCollection.add(metadataTag)
        }

        if (routesHandlersConventions) {
            iterateRequestHandlerConventions(routesHandlersConventions.requestHandlerConventions)
        }

        for (const subgroup of subGroups) {
            iterateGroup(subgroup);
        }
    }

    function processDataSource(dataSource: EndpointDataSource) {
        const handler = dataSource.getHandlers();

        if (instanceOfIGroupeRouteHandlerConventions(handler)) {
            iterateGroup(handler);
        }

        if (instanceOfIRouteHandlerConventions(handler)) {
            iterateRequestHandlerConventions(handler.requestHandlerConventions)
        }
    }

    for (const dataSource of routeMapBuilder.dataSources) {
        processDataSource(dataSource);
    }

    for (let metadataTag of groupedMetadataTagCollection) {
        openApiBuilder.addTag(metadataTag.tagObject)
    }

    for (let metadataScheme of metadataSchemaCollection) {
        openApiBuilder.addSchema(metadataScheme.name, metadataScheme.schema)
    }

}
