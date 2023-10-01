import {OpenapiProp} from "../../openapi/decorators/openapi.prop";


class ValidationError {
    @OpenapiProp(['object'], { required: false })
    target?: object

    @OpenapiProp(['string'])
    property!: string

    @OpenapiProp(['object'], { required: false })
    value?: any

    @OpenapiProp(['object'], {required: false ,additionalProperties: true })
    constraints?: {
        [type: string]: string;
    }

    @OpenapiProp([ValidationError], {type: 'array',  required: false})
    children?: ValidationError[]

    @OpenapiProp(['object'], { required: false, additionalProperties: true })
    contexts?: { [type: string]: any }
}





// Mettre la class suivante totalement en dehors du module http
// elle servira surtout pour openApi. Je ne la placerai pas dans open api mais plutôt dans mon app principal
export class BadRequestObject {
    @OpenapiProp(['string'], { required: false })
    message?: string

    @OpenapiProp([ValidationError], { type: 'array' })
    errors!: ValidationError[]
}
