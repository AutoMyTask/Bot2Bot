import {OpenApiBuilder} from "openapi3-ts/oas31";
import {interfaces} from "inversify";
import {ConfigureServiceCallback} from "../app.builder";

export const configureOpenApi = (callbackConfigureOpenApi?: (builder: OpenApiBuilder) => void ) : ConfigureServiceCallback => {
    return ((service: interfaces.Container) => {
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

