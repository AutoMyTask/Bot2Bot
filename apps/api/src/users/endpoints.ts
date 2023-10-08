import {UserController} from "./user.controller";
import {UserResponse} from "./ressources/UserResponse";
import {Unauthorized} from "../http/errors/Unauthorized";
import {StatutCodes} from "../core/http/StatutCodes";
import {BadRequestObject} from "../http/errors/BadRequest";
import {RouteCore} from "core-types";
import {MetadataProduce, MetadataTag} from "openapi";


export const endpoints = (routeMapBuilder: RouteCore.IRouteMapBuilder) => {
    const userGroup = routeMapBuilder
        .mapGroup('/users')
        .withMetadata(
            new MetadataTag('Users')
        )

    userGroup
        .map('/@me/:id', 'get', UserController, UserController.me)
        .withMetadata(
            new MetadataProduce(UserResponse),
            new MetadataProduce(Unauthorized, StatutCodes.Status401Unauthorized),
            new MetadataProduce(BadRequestObject, StatutCodes.Status400BadRequest)
        )

    return routeMapBuilder
}