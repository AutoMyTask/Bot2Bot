// import app from "./app"

// app.startBots().catch(err => console.log(err))

// app.app.listen(process.env.PORT, () => {
//     console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
// })


import {App} from "./app.builder";
import express from "express";
import {rateLimiter} from "./middlewares/rate.limiter";
import cors from "./middlewares/cors";
import helmet from "helmet";
import {logError} from "./middlewares/log.error";
import {errorHandler} from "./middlewares/error.handler";
import 'reflect-metadata';
import {OpenApiBuilder, ResponsesObject} from "openapi3-ts/oas31";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";


// Pour gérer les erreurs http : http-errors, express-promise-router


/**
 *  CONTROLLERS
 */

// Decorators
function Params(paramName: string) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const existingMetadata = Reflect.getMetadata('params', target, propertyKey) || {}
        const updateMetadata = {...existingMetadata, [parameterIndex]: paramName}
        Reflect.defineMetadata('params', updateMetadata, target, propertyKey);
    }
}

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
// Utiliser la bibliothèque openapi3-ts
// Sécuriser l'accès par mot de passe à Swagger Ui
const apiBuilder = OpenApiBuilder.create()
apiBuilder.addInfo({
    title: 'Mon API',
    version: '1.0.0'
})

apiBuilder.addServer({
    url: 'http://localhost:8080'
})

apiBuilder.addPath('/hello', {
    get: {
        description: 'une description',
        responses: {
            '200': {
                description: 'Une description de la réponses'
            }
        }
    }
})
const api = apiBuilder.getSpec()


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
// Favoriser l'immutabilité
// Mise en place de test U ? Integration ?
app
    .addEndpoint(routeMapBuilder => {
            // routeMapBuilder
            //     .map('/oui/:id', 'get', UserController, UserController.findOne)
            //     .withMiddleware((req, res, next) => {
            //         console.log('oui oui je suis un middleware')
            //        next()
            //    }).extension((builder) => {

            //  })


            //  routeMapBuilder
            //      .map('/non/:id', 'get', UserController, UserController.findOne)
            //      .withMiddleware((req, res, next) => {
            //          console.log('non non je suis un middleware')
            //          next()
            //      })
            //      .extension(builder => {
//
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

app
    .addAppEndpoint('/docs', swaggerUi.serve, swaggerUi.setup(api))
    .addMiddleware(logError)
    .addMiddleware(errorHandler)

// app.build()
app.run()
