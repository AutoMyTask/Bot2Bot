// import app from "./app"

// app.startBots().catch(err => console.log(err))

// app.app.listen(process.env.PORT, () => {
//     console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
// })


import Params, {App, IAppEndpoint} from "./app.builder";
import express from "express";
import {rateLimiter} from "./middlewares/rate.limiter";
import cors from "./middlewares/cors";
import helmet from "helmet";
import {logError} from "./middlewares/log.error";
import {errorHandler} from "./middlewares/error.handler";
import 'reflect-metadata';
import {OpenApiBuilder} from "openapi3-ts/oas31";
import swaggerUi, {JsonObject} from "swagger-ui-express";


// Avoir un comportement commun pour tout les middlewares




// Pour gérer les erreurs http : http-errors, express-promise-router


class UserController {
    // En deuxiéme clés, se serra pour swagger (les paraèmtres pour les conventions)
    // Gérer également l'injection de dépendance directement dans les propriété de la
    // fonction (et oui c'est putin de beau)
    public static findOne(@Params('id') id: number): { oui: boolean } {
        return {oui: true}
    }
}


/**
 * OPENAPI
 */
// https://blog.simonireilly.com/posts/typescript-openapi
// Afficher swagger, comment cela va se passer ? Comment cela va prendre forme ?
// Sécuriser l'accès par mot de passe à Swagger Ui
const openApiBuilder = OpenApiBuilder.create()
const openAPIObject = openApiBuilder.getSpec()
openApiBuilder.addInfo({
    title: 'Mon API',
    version: '1.0.0'
})

openApiBuilder.addPath('/auth/oui', {
    get: {
        description: 'une description',
        responses: {
            '200': {
                description: 'Une description de la réponses',
                headers: {
                    name: { $ref: 'ref' }
                }
            }
        }
    },
    parameters: [
        { name: 'expand', in: 'query' }
    ]
})



// Swagger Ui
const useAppEndpointSwaggerUI = (route: string, swaggerDoc: JsonObject): IAppEndpoint => ({
    route,
    handlers: [swaggerUi.serve, swaggerUi.setup(swaggerDoc)]
})


/**
 * MODULE API CORE
 */

const app = App.createApp()
app.configure((services) => {
})
app
    .addMiddleware(express.json())
    .addMiddleware(express.urlencoded({extended: true}))
    .addMiddleware(rateLimiter)
    .addMiddleware(cors)
    .addMiddleware(helmet())


// Vérifier le bon format des routes '/route' au niveau de ... ?
// Gérer les erreurs de paramètres dans findOne par exemple. Si y a pas l'id et que c'est pas un nombre
// je throw
// Mise en place de test U ? Integration ?
app
    .addEndpoint(routeMapBuilder => {
            // routeMapBuilder
            //     .map('/oui/:id', 'get', UserController, UserController.findOne)
            //     .withMiddleware((req, res, next) => {
            //         console.log('oui oui je suis un middleware')
            //        next()
            //    })


            //  routeMapBuilder
            //      .map('/non/:id', 'get', UserController, UserController.findOne)
            //      .withMiddleware((req, res, next) => {
            //          console.log('non non je suis un middleware')
            //          next()
            //      })

            const groupAuth = routeMapBuilder
                .mapGroup('/auth')
                .withMiddleware((req, res, next) => {
                    console.log('"auth" préfix')
                    next()
                })

            groupAuth
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            const groupAuthOui = groupAuth
                .mapGroup('/ouiN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/ouiN" préfix')
                    next()
                })

            const groupAuthNon = groupAuth
                .mapGroup('/nonN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/nonN" préfix')
                    next()
                })

            groupAuthNon
                .mapGroup('/jaja')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/nonN/jaja" préfix')
                    next()
                })

            groupAuthNon
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            groupAuthOui
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            groupAuth
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })


            return routeMapBuilder
        }
    )

app.mapEndpoints()

app
    .addAppEndpoint(useAppEndpointSwaggerUI('/docs', openAPIObject)) // Vérifier le bon format du chemin ('/docs')
    .addMiddleware(logError)
    .addMiddleware(errorHandler)

// app.build()
app.run()
