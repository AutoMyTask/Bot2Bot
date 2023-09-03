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


// Pour gérer les erreurs http : http-errors, express-promise-router

// MODULE API CORE
const app = App.createApp()

app.configure((services) => {
})

// Global Middlewares
app
    .addMiddleware(express.json())
    .addMiddleware(express.urlencoded({extended: true}))
    .addMiddleware(rateLimiter)
    .addMiddleware(cors)
    .addMiddleware(helmet())


// Decorators
function Params(paramName: string) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const existingMetadata = Reflect.getMetadata('params', target, propertyKey) || {}
        const updateMetadata = {...existingMetadata, [parameterIndex]: paramName}
        Reflect.defineMetadata('params', updateMetadata, target, propertyKey);
    }
}

class UserController {
    public static findOne(@Params('id') id: number): { oui: boolean } {
        return {oui: true}
    }
}


// Revoir le processus de build des routers. Tout empaqueter dans les EndpointSource
// Construire ensuite les routers par cet intermediaire

// Vérifier le bon format des routes '/route' au niveau de ... ?
// Je recrée trop à l'infi de router. Il faut que je condense en un seul router final
// Gérer les erreur de paramétre dans findOne par exemple. Si y a pas l'id et que c'est pas un nombre
// je throw
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


            //  groupAuth
            //      .map('/non', "get", UserController, UserController.findOne)

            return routeMapBuilder
        }
    )

app
    .addMiddleware(logError)
    .addMiddleware(errorHandler)

// app.build()
app.run()
