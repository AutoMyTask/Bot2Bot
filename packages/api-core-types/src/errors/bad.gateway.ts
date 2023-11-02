import {BadGateway as HttpBadGateway} from "http-errors";

export class BadGateway extends HttpBadGateway{
    constructor(message: string, errors: string[]) {
        super(message)
        this.errors = errors
        this.name = 'BadGateway'
    }
}
