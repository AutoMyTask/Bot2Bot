import {IServiceCollection, RequestCore} from "api-core-types";

declare global {
    namespace Express {
        export interface Request {
            args?: RequestCore.Params.ArgHandler[];
            services: IServiceCollection
        }
    }
}

export { errorHandler } from './http/errors/use.error.handler'

export { AppBuilder } from './app.builder'
export { StatutCodes } from './http/StatutCodes'
export { Service } from './request/params/decorators/params.service.decorator'
export { Map } from './request/params/decorators/params.map.decorator'
export { Params } from './request/params/decorators/params.path.decorator'
export { Query } from './request/params/decorators/params.query.decorator'
