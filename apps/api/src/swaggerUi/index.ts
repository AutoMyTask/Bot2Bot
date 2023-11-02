import {AppCore, IServiceCollection} from "api-core-types";
import * as swaggerUiExpress from "swagger-ui-express";
import {JsonObject} from "swagger-ui-express";


type CallbackAddOpenApiJson = (services: IServiceCollection) => JsonObject

export const swaggerUi = (addOpenapiJson: CallbackAddOpenApiJson) => (app: AppCore.IApp) => {
    const openAPISpec = addOpenapiJson(app.services)
    app.app.use('/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(openAPISpec))
    app.app.use('/swagger.json', (req, res) => {
        res.json(openAPISpec)
    })
}
