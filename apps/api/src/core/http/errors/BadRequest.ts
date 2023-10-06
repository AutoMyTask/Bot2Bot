import {BadRequest} from "http-errors";

export class BadRequestObject extends BadRequest{
    errors: any[] | ReadonlyArray<any>
    constructor(errors: any[] | ReadonlyArray<any>, message?: string) {
        super(message);
        this.errors = errors
        this.name = 'BadRequestObject'
    }
}
