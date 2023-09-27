// ORM: https://github.com/mikro-orm/guide
// Il y a des choses intéréssantes à utiliser dans mon code: https://fettblog.eu/advanced-typescript-guide/


// DEBUT DES TESTS D'INTEGRATIONS

import express, {NextFunction} from "express";
import helmet from 'helmet';

import cors from "cors";

// Api Core
import {logError} from "./core/http/errors/middlewares/log.error";
import {errorHandler} from "./core/http/errors/middlewares/error.handler";
import 'reflect-metadata';


// Open Api Module
import {
    OpenApiBuilder
} from "openapi3-ts/oas31";
import {configureOpenApi} from "./openapi/configure.openapi";
import {openapi} from "./openapi/openapi";
import {MetadataTag} from "./openapi/metadata/metadataTag";
import {MetadataProduce} from "./openapi/metadata/metadataProduce";
import {OpenApiBadRequestObject} from "./http/errors/BadRequest"; // Je ne sais pas...

// 'open api'
import {OpenapiProp} from "./openapi/decorators/openapi.prop";

// 'core'
import {IsInt, IsNotEmpty, IsString} from "class-validator";

// 'app'
import {auth} from "express-oauth2-jwt-bearer";
import {AuthService} from "./auth/auth.service";
import {configureAuth} from "./auth/configure.auth";
import {Params} from "./core/request/params/decorators/params.path.decorator";
import {Service} from "./core/request/params/decorators/params.service.decorator";
import {Body} from "./core/request/params/decorators/params.body.decorator";
import {AppBuilder} from "./core/app.builder";
import {StatutCodes} from "./core/http/StatutCodes";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";


// VOIR LA SECTION METADONNEE POUR ELIMINE DANS LE FUTURE LA DEPENDANCE REFLECT METADATA
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/


// Avoir un comportement commun pour tous les middlewares
class UserRequest {
    @IsInt()
    @IsNotEmpty()
    @OpenapiProp('number', {required: true})
    oui!: number


    @IsNotEmpty()
    @IsString()
    @OpenapiProp('string', {required: true})
    non!: string
}

class AuthOuiResponse {
    @OpenapiProp('boolean')
    public oui!: boolean
}

function postUserMiddleware(
    id: number,
    userRequest: UserRequest,
    authService: AuthService,
    next: NextFunction
) {
    console.log(id)
    next()
}

class UserController {
    public static findOne(
        @Params('username') username: string,
        @Params('id', 'float') id: number
    ): AuthOuiResponse {
        return {oui: false}
    }

    public static postUser(
        @Params('id') id: number,
        @Body userRequest: UserRequest,
        @Service() authService: AuthService
    ): { oui: boolean } {
        return {oui: true}
    }
}


const builder = AppBuilder.createAppBuilder()


builder.configure(configureOpenApi(builder => {
    const authorizationUrl = `${process.env.AUTH0_DOMAIN}/authorize?audience=${process.env.AUTH0_AUDIENCE}&connection=discord`
    builder.addInfo({
        title: 'Mon API',
        version: '1.0.0',
        description: 'Une putin de description',
        contact: {
            name: 'François-Pierre ROUSSEAU',
            url: 'mon linkldn',
            email: 'francoispierrerousseau.44@gmail.com'
        }
    })
    builder.addSecurityScheme('oauth2', {
        name: "Authorization",
        type: "oauth2",
        flows: {
            authorizationCode: {
                authorizationUrl,
                scopes: {}
            },
            implicit: {
                authorizationUrl,
                scopes: {}
            },
        }
    }).addSecurityScheme('bearer', {
        description: 'JWT containing userid claim',
        name: 'Authorization',
        type: 'apiKey',
        in: 'header',
    })
})).configure(configureAuth)


builder.addAuthentification(auth({
    issuerBaseURL: process.env.AUTH0_ISSUER,
    audience: process.env.AUTH0_AUDIENCE,
    tokenSigningAlg: process.env.AUTH0_SIGNING_ALG
}), ['oauth2', 'bearer'])


builder
    .addEndpoint(routeMapBuilder => {
            routeMapBuilder
                .map('/oui/:id/:username', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    ))


            routeMapBuilder
                .map('/non/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('non non je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            const authGroup = routeMapBuilder
                .mapGroup('/auth')
                .withMiddleware((req, res, next) => {
                    next()
                })
                .withMetadata(
                    new MetadataTag(
                        'Auth',
                        'Description de Auth'
                    )
                ).allowAnonymous()

            //authGroup
           //     .map('/oui/:id', 'get', UserController, UserController.findOne)
           //     .withMiddleware((req, res, next) => {
           //         console.log('oui oui je suis un middleware')
           //         next()
           //     })
           //     .withMetadata(
           //         new MetadataProduce(
           //             AuthOuiResponse,
           //             StatutCodes.Status200OK
           //         )
           //     )
//
           // authGroup
           //     .map('/oui/:id', 'post', UserController, UserController.postUser)
           //     .withMetadata(
           //         new MetadataProduce(
           //             AuthOuiResponse,
           //             StatutCodes.Status200OK
           //         )
           //     )
           //     .withMetadata(
           //         new MetadataProduce(
           //             OpenApiBadRequestObject,
           //             StatutCodes.Status400BadRequest
           //         )
           //     )


            const authOuiGroup = authGroup
                .mapGroup('/ouiN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/ouiN" prefix')
                    next()
                }).withMetadata(
                    new MetadataTag('AuthOui', 'AuthOui description')
                ).requireAuthorization()

            const authNonGroup = authGroup
                .mapGroup('/nonN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/nonN" prefix')
                    next()
                }).withMetadata(
                    new MetadataTag(
                        'AuthNon',
                        'AuthNon description'
                    )
                ).requireAuthorization()

            const jajaGroup = authNonGroup
                .mapGroup('/jaja')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/nonN/jaja" prefix')
                    next()
                })
                .withMetadata(
                    new MetadataTag(
                        'Jaja',
                        'une petite description jaja'
                    )
                ).allowAnonymous()

            jajaGroup
                .map('/oui/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    next()
                })
                .withMetadata(
                    new MetadataTag(
                        'Arg',
                        "Une description d'arg "
                    ),
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    ))


            authNonGroup
                .map('/oui/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                ).allowAnonymous()

            authNonGroup
                .map('/non/:id', 'get', UserController, UserController.findOne)
                // A mon avis utilise des decorateur pour mapper
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            authOuiGroup
                .map('/oui/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            return routeMapBuilder
        }
    )


const app = builder.build()

app
    .useAuthentification()
    .use(openapi)
    .use(({app, services}) => {
        const openAPIObject = services
            .get<OpenApiBuilder>(OpenApiBuilder)
            .getSpec()
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(openAPIObject))
    })
    .use(logError)
    .use(errorHandler)
    .use(({app}) => {
        app
            .use(
                express.json(),
                express.urlencoded({extended: true}),
                rateLimit({
                    windowMs: 60 * 60 * 60,
                    max: 100,
                }),
                cors({
                    origin: 'http://localhost:8080'
                }),
                helmet()
            )
    })
    .mapEndpoints()


app.run({port: process.env.PORT})


