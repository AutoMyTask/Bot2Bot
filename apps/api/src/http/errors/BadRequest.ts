import {OpenapiProp} from "../../openapi/decorators/openapi.prop";


class OpenApiValidationError {
    @OpenapiProp('object', { required: false })
    target?: object

    @OpenapiProp('string')
    property!: string

    @OpenapiProp('object', { required: false })
    value?: any

    @OpenapiProp('object', {required: false ,additionalProperties: true })
    constraints?: {
        [type: string]: string;
    }

    @OpenapiProp(OpenApiValidationError, {type: 'array',  required: false}) // Je dois pouvoir faire référence à lui même. Il va donc faloir le faire dans le décorateur à mon avis
    children?: OpenApiValidationError[]

    @OpenapiProp("object", { required: false, additionalProperties: true })
    contexts?: { [type: string]: any }
}





// Mettre la class suivante totalement en dehors du module http
// elle servira surtout pour openApi. Je ne la placerai pas dans open api mais plutôt dans mon app principal
export class OpenApiBadRequestObject {
    @OpenapiProp('string', { required: false })
    message?: string

    @OpenapiProp(OpenApiValidationError, { type: 'array' })
    errors!: OpenApiValidationError[]
}
