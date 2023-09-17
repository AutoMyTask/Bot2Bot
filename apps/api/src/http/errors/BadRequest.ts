import {BadRequest} from "http-errors";
import {ValidationError} from "class-validator";
import {OpenapiProp} from "../../openapi/decorators/openapi.prop";
import {OpenapiPropArray} from "../../openapi/decorators/openapi.prop.array";



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

    @OpenapiPropArray(OpenApiValidationError, { required: false}) // Je dois pouvoir faire référence à lui même. Il va donc faloir le faire dans le décorateur à mon avis
    children?: OpenApiValidationError[]

    @OpenapiProp("object", { required: false, additionalProperties: true })
    contexts?: { [type: string]: any }
}





// Mettre la class suivante totalement en dehors du module http
// elle servira surtout pour openApi. Je ne la placerai pas dans open api mais plutôt dans mon app principal
export class OpenApiBadRequestObject {
    @OpenapiProp('string', { required: false })
    message?: string

    @OpenapiPropArray(OpenApiValidationError)
    errors!: OpenApiValidationError[]
}


export class BadRequestObject extends BadRequest{
    errors: ValidationError[] | string[]
    constructor(message: string, errors: ValidationError[] | string[]) {
        super(message);
        this.errors = errors
        this.name = 'BadRequestObject'
    }
}
