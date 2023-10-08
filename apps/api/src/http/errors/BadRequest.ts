import {OpenapiProp} from "openapi";

class ValidationError {
    @OpenapiProp({type: 'object'}, {required: false})
    target?: object

    @OpenapiProp({type: 'string'})
    property!: string

    @OpenapiProp({type: 'object'}, {required: false})
    value?: object

    @OpenapiProp({type: 'object', option: { additionalProperties: true }}, {required: false})
    constraints?: {
        [type: string]: string;
    }

    @OpenapiProp({type: 'array', option: {type: ValidationError}}, {required: false})
    children?: ValidationError[]

    @OpenapiProp({type: 'object', option: { additionalProperties: true }}, {required: false })
    contexts?: { [type: string]: any }
}



// Mettre la class suivante totalement en dehors du module http
// elle servira surtout pour openApi. Je ne la placerai pas dans open api mais plutôt dans mon app principal


export class BadRequestObject {
    @OpenapiProp({type: 'string'}, {required: false})
    message?: string

    @OpenapiProp({type: 'array', option: {type: [ValidationError, 'string']}})
    errors!: ValidationError[]
}
