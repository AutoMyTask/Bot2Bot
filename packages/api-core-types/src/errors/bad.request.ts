import {BadRequest as HttpBadRequest} from "http-errors";

export class BadRequest extends HttpBadRequest {
    errors: any[] | ReadonlyArray<any>

    constructor(errors: any[] | ReadonlyArray<any>, message?: string) {
        super(message);
        this.errors = errors
        this.name = 'BadRequest'
    }
}
