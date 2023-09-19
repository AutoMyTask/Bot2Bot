import {BadRequest} from "http-errors";
import {ValidationError} from "class-validator";

export class BadRequestObject extends BadRequest{
    errors: ValidationError[] | string[]
    constructor(message: string, errors: ValidationError[] | string[]) {
        super(message);
        this.errors = errors
        this.name = 'BadRequestObject'
    }
}
