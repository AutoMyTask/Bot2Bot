import {InfoObject, OpenApiBuilder} from "openapi3-ts/oas31";
import {interfaces} from "inversify";
import {ConfigureServiceCallback} from "../app.builder";

export const configureOpenApi = (info: InfoObject) : ConfigureServiceCallback => {
    return ((service: interfaces.Container) => {
        service
            .bind<OpenApiBuilder>(OpenApiBuilder)
            .toDynamicValue(() => OpenApiBuilder.create().addInfo(info))
            .inSingletonScope()
    })
}
