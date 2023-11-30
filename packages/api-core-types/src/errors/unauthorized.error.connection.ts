import { Unauthorized } from 'http-errors'

export class UnauthorizedErrorConnection extends Unauthorized {
    constructor(message: string, errors: {status: number, connection: string}[]) {
        super(message);
        this.errors = errors
        this.name = 'UnauthorizedErrorConnection'
    }
}
