import {BadGateway} from "http-errors";

export class BadGatewayObject extends BadGateway{
    constructor(message: string, errors: string[]) {
        super(message)
        this.errors = errors
        this.name = 'BadGatewayObject'
    }
}
