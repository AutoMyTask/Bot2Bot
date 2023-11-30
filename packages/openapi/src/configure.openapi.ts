import {OpenApiBuilder} from "openapi3-ts/oas31";
import {ConfigureServiceCallback, IServiceCollection} from "api-core-types";

export const configureOpenApi = (callbackConfigureOpenApi: (builder: OpenApiBuilder) => void) : ConfigureServiceCallback => {
    return ((service: IServiceCollection) => {
        service
            .bind<OpenApiBuilder>(OpenApiBuilder)
            .toDynamicValue(() => OpenApiBuilder.create())
            .inSingletonScope()

        const openApiBuilder = service.get(OpenApiBuilder)

        if (callbackConfigureOpenApi){
            callbackConfigureOpenApi(openApiBuilder)
        }
    })
}

