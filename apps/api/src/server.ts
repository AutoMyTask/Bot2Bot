// ORM: https://github.com/mikro-orm/guide
// Il y a des choses intéréssantes à utiliser dans mon code: https://fettblog.eu/advanced-typescript-guide/


import express from "express";
import helmet from 'helmet';
import cors from "cors";
import {logError} from "./core/http/errors/middlewares/log.error";
import {errorHandler} from "./core/http/errors/middlewares/error.handler";
import 'reflect-metadata';
import {auth} from "express-oauth2-jwt-bearer";
import {AppBuilder} from "./core/app.builder";
import rateLimit from "express-rate-limit";
import {configureAuth0} from "./auth0/auth0.service";
import {configureDiscord} from "./discord";
import {endpoints as userEndpoints} from "./users/endpoints";
import {configure as configureUser} from "./users/configure";
import {openapi, configureOpenApi, OpenApiBuilder} from "openapi";
import swaggerUi from 'swagger-ui-express'


// VOIR LA SECTION METADONNEE POUR ELIMINE DANS LE FUTURE LA DEPENDANCE REFLECT METADATA
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/

/*
    Front end: afficher les erreurs
    Toaster vue.js : https://vue-toastification.maronato.dev/?ref=madewithvuejs.com
 */

/*
    Configuration de docker/kubernetes

    Créer un custom database auth0
    Auto générer un sdk dans un package. Configurer la synchro des commandes turbo repos pour prendre en compte les changements

    Uniformiser les erreurs

    Va falloir que je sécurise les connections (application -> github, application -> openapi.json, user -> swagger))
 */
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
}), configureAuth0(
    process.env.AUTH0_API_MANAGEMENT_CLIENT_ID ?? '',
    process.env.AUTH0_API_MANAGEMENT_CLIENT_SECRET ?? '',
    process.env.AUTH0_API_MANAGEMENT_GRANT_TYPE ?? '',
    process.env.AUTH0_API_MANAGEMENT_AUDIENCE ?? ''
), configureDiscord, configureUser)

builder.addAuthentification(auth({
    issuerBaseURL: process.env.AUTH0_ISSUER,
    audience: process.env.AUTH0_AUDIENCE,
    tokenSigningAlg: process.env.AUTH0_SIGNING_ALG
}), ['oauth2', 'bearer'])


builder
    .addEndpoint(userEndpoints)


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
                express.json({
                    limit: '1mb'
                }),
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


