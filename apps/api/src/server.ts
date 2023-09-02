// import app from "./app"

// app.startBots().catch(err => console.log(err))

// app.app.listen(process.env.PORT, () => {
//     console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
// })


import {App} from "./app.builder";
import express, {Response} from "express";
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

// A voir si je n'étend plus le groupedBuilder (héritage) et que à la place j'utilise une liste
// de route builder


// Vérifier le bon format des routes '/route' au niveau de ... ?
// Je recrée trop à l'infi de router. Il faut que je condense en un seul router final
app
    .addEndpoint(routeMapBuilder => {
            routeMapBuilder
                .map('/oui/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                }).extension((builder) => {

            })


            routeMapBuilder
                .map('/non/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('non non je suis un middleware')
                    next()
                })
                .extension(builder => {

                })

            const groupAuth = routeMapBuilder
                .mapGroup('/ouiNon')
                .withMiddleware((req, res, next) => {
                    console.log('"ouiNon" préfix')
                    next()
                })


            groupAuth
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })


            groupAuth
                .map('/non', "get", UserController, UserController.findOne)

            return routeMapBuilder
        }
    )

app
    .addMiddleware(logError)
    .addMiddleware(errorHandler)

// app.build()
app.run()
