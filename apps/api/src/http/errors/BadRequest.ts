import {OpenapiProp} from "openapi";

class ObjectValidationError {
    @OpenapiProp({type: 'object'}, {required: false})
    target?: object

    @OpenapiProp({type: 'string'})
    property!: string

    @OpenapiProp({type: 'object'}, {required: false})
    value?: object

    @OpenapiProp({type: 'object', option: {additionalProperties: true}}, {required: false})
    constraints?: {
        [type: string]: string;
    }

    @OpenapiProp({type: 'array', option: {type: ObjectValidationError}}, {required: false})
    children?: ObjectValidationError[]

    @OpenapiProp({type: 'object', option: {additionalProperties: true}}, {required: false})
    contexts?: { [type: string]: any }
}

enum LocationEnum {
    Body = 'body',
    Cookie = 'cookies',
    Headers = "headers",
    Params = 'params',
    Query = 'query'
}


// {type: "field", location: Location, path: string, value: any, msg: any}
class ParamValidationError {
    @OpenapiProp({type: 'string'})
    type!: string

    @OpenapiProp({type: 'object', option: {type: {type: LocationEnum, name: 'LocationEnum'}}})
    location!: LocationEnum
}


export class BadRequestObject {
    @OpenapiProp({type: 'string'}, {required: false})
    message?: string

    @OpenapiProp(
        [
            {type: 'array', option: {type: ObjectValidationError}},
            {type: 'array', option: {type: 'string'}},
            {type: 'array', option: {type: ParamValidationError}}
        ])
    errors!: ObjectValidationError[] | string[] | ParamValidationError[]
}
