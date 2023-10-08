import {OpenApiBuilder, } from "openapi3-ts/oas31";
import {createPathItem} from "./create.path";
import {createRequestBody} from "./create.requestBody";
import {MetadataTag} from "./metadata/metadataTag";
import {MetadataProduce} from "./metadata/metadataProduce";
import {createResponseObject} from "./create.responseObject";
import {AppCore, IServiceCollection, RouteCore} from "core-types";
import {SchemaStore} from "./store/schema.store";


/**
 * MODULE OPENAPI
 * Créer un referenciel de schema commun. J'ajoute à ce reférenciel tout les schema pour éviter
 * la récursion et une boucle infini. Si il schema à déja été ajouté à ce referenciel commun, je retourne sinon je continue
 * pour éviter justement cette recursion inifi
 */
// https://blog.simonireilly.com/posts/typescript-openapi

type GroupedMetadataTag = {
    name: string;
    tag: MetadataTag;
};


function processRouteHandlers(
    services: IServiceCollection,
    conventions: RouteCore.IRouteConventions[]
) {
    const schemaStore = new SchemaStore()

    const groupedMetadataTagCollection = new Map<string, GroupedMetadataTag>()


    for (const {
        path,
        params,
        prefixes,
        method,
        body,
        metadataCollection,
        auth
    } of conventions) {
        const metadataTags = metadataCollection.getAllMetadataAttributes(MetadataTag)

        const metadataProduces = metadataCollection
            .getAllMetadataAttributes(MetadataProduce)



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

        const fullPath = prefixes.slice().reverse().reduce((path, prefix) => {
            return prefix.description + path
        }, path).replace(/\/:([^/]+)/g, '/{$1}');

        const openApiBuilder = services.get<OpenApiBuilder>(
            OpenApiBuilder
        );

        openApiBuilder.addPath(fullPath, pathItem);

        if (body) {
            schemaStore.addSchema(body)  // Peut être qu'il n'y aura pas besoin de le rajouter !!!
            const reqBody = createRequestBody(body);
            openApiBuilder.addRequestBody(body.name, reqBody);
        }

        for (const metadataProduce of metadataProduces) {
            const responseObject = createResponseObject(metadataProduce);
            openApiBuilder.addResponse(metadataProduce.type.name, responseObject);
        }
    }

    return {groupedMetadataTagCollection}
}

export {configureOpenApi} from './configure.openapi'

export {MetadataTag} from './metadata/metadataTag'

export {MetadataProduce} from './metadata/metadataProduce'

export {OpenapiProp} from './decorators/openapi.prop'
export const openapi = (app: AppCore.IApp): void => {

    const {
        groupedMetadataTagCollection,
    } = processRouteHandlers(app.services, app.conventions);


    const openApiBuilder = app.services.get<OpenApiBuilder>(
        OpenApiBuilder
    );

    for (const metadataTag of groupedMetadataTagCollection.values()) {
        openApiBuilder.addTag(metadataTag.tag.tagObject)
    }


    const schemaStore = new SchemaStore()

    for (const {type, schema} of schemaStore.schemas.values()) {
        openApiBuilder.addSchema(type.name, schema)
    }
}


export {OpenApiBuilder}
