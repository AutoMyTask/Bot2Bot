import {OpenapiProp} from "openapi";

class ValidationError {
    @OpenapiProp([
        {type: 'object'}
    ], {required: false})
    target?: object

    @OpenapiProp([
        {type: 'string'}
    ])
    property!: string

    @OpenapiProp([
        {type: 'object'}
    ], {required: false})
    value?: object

    @OpenapiProp([
        {type: 'object'}
    ], {required: false, additionalProperties: true})
    constraints?: {
        [type: string]: string;
    }

    // [ValidationError], {type: 'array', required: false}

    @OpenapiProp([
        {type: ValidationError, option: {type: 'array'}}
    ], {required: false})
    children?: ValidationError[]

    @OpenapiProp([
            {type: 'object'}
        ], {required: false, additionalProperties: true}
    )
    contexts?: { [type: string]: any }
}



// Mettre la class suivante totalement en dehors du module http
// elle servira surtout pour openApi. Je ne la placerai pas dans open api mais plutôt dans mon app principal

export class BadRequestObject {
    @OpenapiProp([
        {type: 'string'}
    ], {required: false})
    message?: string

    @OpenapiProp([
        {type: ValidationError, option: {type: 'array'}},
    ])
    errors!: ValidationError[]
}
