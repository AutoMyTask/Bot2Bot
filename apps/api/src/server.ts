// ORM: https://github.com/mikro-orm/guide
// Il y a des choses intéréssantes à utiliser dans mon code: https://fettblog.eu/advanced-typescript-guide/


// DEBUT DES TESTS D'INTEGRATIONS

import express from "express";
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


// 'app'
import {auth} from "express-oauth2-jwt-bearer";
import {AppBuilder} from "./core/app.builder";
import {StatutCodes} from "./core/http/StatutCodes";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import {configureAuth0} from "./auth0/auth0.service";
import {configureDiscord} from "./discord";
import {UserController} from "./users/UserController";
import {Unauthorized} from "./http/errors/Unauthorized";
import {UserResponse} from "./users/ressources/UserResponse";
import {BadRequestObject} from "./http/errors/BadRequest";


// VOIR LA SECTION METADONNEE POUR ELIMINE DANS LE FUTURE LA DEPENDANCE REFLECT METADATA
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/


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
}))
    .configure(configureAuth0(
        process.env.AUTH0_API_MANAGEMENT_CLIENT_ID ?? '',
        process.env.AUTH0_API_MANAGEMENT_CLIENT_SECRET ?? '',
        process.env.AUTH0_API_MANAGEMENT_GRANT_TYPE ?? '',
        process.env.AUTH0_API_MANAGEMENT_AUDIENCE ?? ''
    ))
    .configure(configureDiscord)


builder.addAuthentification(auth({
    issuerBaseURL: process.env.AUTH0_ISSUER,
    audience: process.env.AUTH0_AUDIENCE,
    tokenSigningAlg: process.env.AUTH0_SIGNING_ALG
}), ['oauth2', 'bearer'])


builder
    .addEndpoint(routeMapBuilder => {
            const userGroup = routeMapBuilder
                .mapGroup('/users')
                .withMetadata(
                    new MetadataTag('Users')
                )

            userGroup
                .map('/@me', 'get', UserController, UserController.me)
                .withMetadata(
                    new MetadataProduce(UserResponse),
                    new MetadataProduce(Unauthorized, StatutCodes.Status401Unauthorized),
                    new MetadataProduce(BadRequestObject, StatutCodes.Status400BadRequest)
                )

            return routeMapBuilder
        }
    )


const app = builder.build()

app
    .useAuthentification()
    .use(openapi)
    .use(({app, services}) => {
        const openAPISpec = services
            .get<OpenApiBuilder>(OpenApiBuilder)
            .getSpec()

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(openAPISpec))
        app.use('/swagger.json', (req, res) => {
            res.json(openAPISpec)
        })
    })
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
                helmet(),
            )
    })
    .mapEndpoints()

app
    .use(logError)
    .use(errorHandler)


app.run({port: process.env.PORT})


