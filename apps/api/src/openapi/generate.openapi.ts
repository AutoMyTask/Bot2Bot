import {
    EndpointDataSource,
    IGroupeRouteHandlerConventions, instanceOfIGroupeRouteHandlerConventions, instanceOfIRouteHandlerConventions,
    IRequestHandlerConventions,
    IRouteMapBuilder
} from "../app.builder";
import {OpenApiBuilder} from "openapi3-ts/oas31";
import {createPathItem} from "./create.path";
import {isEmpty} from "radash";
import {createRequestBody} from "./create.requestBody";
import {createSchema} from "./create.schema";

export const generateOpenApi = (
    routeMapBuilder: IRouteMapBuilder
): void  => {
    const openApiBuilder = routeMapBuilder.services
        .get<OpenApiBuilder>('OpenApiBuilder')

    function iterateRequestHandlerConventions(requestHandlerConventions: IRequestHandlerConventions[]): void {
        for (const {params, fullPath, method, body} of requestHandlerConventions) {
            const path = fullPath.replace(/:([^}]*)/g, '{$1}')
            const pathItem = createPathItem(params, method, body)
            openApiBuilder.addPath(path, pathItem)
            if (!isEmpty(body)) {
                const reqBody = createRequestBody(body)
                const schema = createSchema(body)
                // Si le schema est vide, générer une erreur
                openApiBuilder.addRequestBody(body.constructor.name, reqBody)
                openApiBuilder.addSchema(body.constructor.name, schema)
            }
        }
    }

    function iterateGroup({routesHandlersConventions, subGroups}: IGroupeRouteHandlerConventions) {
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
}
