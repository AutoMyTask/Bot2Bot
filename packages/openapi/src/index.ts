import {OpenApiBuilder,} from "openapi3-ts/oas31";
import {createPathItem} from "./create.path";
import {createRequestBody} from "./create.requestBody";
import {MetadataTag} from "./metadata/metadataTag";
import {MetadataProduce} from "./metadata/metadata.produce";
import {AppCore, RouteCore} from "core-types";
import {SchemaStore} from "./store/schema.store";


/**
 * MODULE OPENAPI
 */
// https://blog.simonireilly.com/posts/typescript-openapi

type GroupedMetadataTag = {
    name: string;
    tag: MetadataTag;
};


function processRouteHandlers(
    openApiBuilder: OpenApiBuilder,
    schemaStore: SchemaStore,
    conventions: RouteCore.IRouteConventions[]
) {

    const groupedMetadataTagCollection = new Map<string, GroupedMetadataTag>()


    for (const {
        path,
        request,
        prefixes,
        method,
        metadataCollection,
        auth
    } of conventions) {
        const metadataTags = metadataCollection.getAllMetadataAttributes(MetadataTag)
        const metadataProduces = metadataCollection.getAllMetadataAttributes(MetadataProduce)

        for (const metadataProduce of metadataProduces) {
            schemaStore.addSchema(metadataProduce.type)
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
            request.params,
            method,
            metadataTags,
            metadataProduces,
            auth?.schemes
        );

        const fullPath = prefixes.slice().reverse().reduce((path, prefix) => {
            return prefix.description + path
        }, path).replace(/\/:([^/]+)/g, '/{$1}');


        openApiBuilder.addPath(fullPath, pathItem);

        if (request.params.body) {
            schemaStore.addSchema(request.params.body.type)
            const reqBody = createRequestBody(request.params.body.type);
            openApiBuilder.addRequestBody(request.params.body.name, reqBody);
        }

        for (const metadataProduce of metadataProduces) {
            openApiBuilder.addResponse(metadataProduce.type.name, metadataProduce.responseObject);
        }
    }

    return {groupedMetadataTagCollection}
}

export {configureOpenApi} from './configure.openapi'

export {MetadataTag} from './metadata/metadataTag'

export {MetadataProduce} from './metadata/metadata.produce'

export {OpenapiProp} from './decorators/openapi.prop'

export const openapi = (app: AppCore.IApp): void => {
    const openApiBuilder = app.services.get<OpenApiBuilder>(OpenApiBuilder)
    const schemaStore = new SchemaStore()

    const {
        groupedMetadataTagCollection,
    } = processRouteHandlers(openApiBuilder, schemaStore, app.conventions);


    for (const metadataTag of groupedMetadataTagCollection.values()) {
        openApiBuilder.addTag(metadataTag.tag.tagObject)
    }


    // Type pas forcément à conserver (utiliser entries à la place)
    for (const {type, schema} of schemaStore.getSchemas.values()) {
        openApiBuilder.addSchema(type.name, schema)
    }
}


export {OpenApiBuilder}
