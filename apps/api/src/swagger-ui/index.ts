import swaggerUi, {JsonObject} from "swagger-ui-express";
import {IAppEndpoint} from "../app.builder";

export const useSwaggerUI = (route: string, swaggerDoc: JsonObject): IAppEndpoint => {
    return {
        route,
        handlers: [swaggerUi.serve, swaggerUi.setup(swaggerDoc)]
    }
}
