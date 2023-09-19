import {interfaces} from "inversify";
import {ISingleRouteBuilder} from "./single.route.builder";
import {BaseRouteBuilder} from "./base.route.builder";
import {IGroupedRouteBuilder} from "./grouped.route.builder";
import {New} from "../types";

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
export type CallbackRouteMapBuilder<T extends void | IRouteMapBuilder> = (routeMapBuilder: IRouteMapBuilder) => InstanceType<T>

export interface IRouteMapBuilder {
    services: interfaces.Container;
    map: (path: string, methode: HTTPMethod, controllerType: New, controllerFunction: Function) => ISingleRouteBuilder
    mapGroup: (prefix: string) => IGroupedRouteBuilder;
    baseRouteBuilders: BaseRouteBuilder[];
    extensions: (callback: CallbackRouteMapBuilder<void>) => IRouteMapBuilder
}
