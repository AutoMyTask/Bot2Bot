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

// Sera mis dans un package APP Core
const app = App.createBuilder()

// Global Middlewares
app
    .addMiddleware(express.json())
    .addMiddleware(express.urlencoded({extended: true}))
    .addMiddleware(rateLimiter)
    .addMiddleware(cors)
    .addMiddleware(helmet())


// Création de MapGroup (la il va falloir stocké tout les endpoints dans un seul et même endroit)
// Le mieux serrait au niveau de APP. Cela permettrait par la suite d'utiliser les endpoints pour
// la definition open api. Implémenter dans ce cas là l'interface IRouteMapBuilder au niveau d'APP
// Vérifier le bon format de la chaine '/auth' au niveau de ... ?
// Regarder 'tsyringe' pour l'injection de dépendance
app
    .addEndpoint(routeMapBuilder => {
            const groupAuth = routeMapBuilder.mapGroup('/auth')

            groupAuth.withMiddleware((req, res, next) => {
                console.log('je suis dans la route "/auth" ')
                next()
            })

            const routeOui = groupAuth
                .map('/oui', 'get', (req, res) => {
                    res.json({oui: true})
                }).withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            const routeNon = groupAuth
                .map('/non', "get", (req, res) => {
                    return res.json({oui: false})
                })
                .withMiddleware((req, res, next) => {
                    console.log('non non je suis un middleware')
                    next()
                })

            // Je devrais pouvoir faire routeMapBuilder.build() et construire ainsi mes routes
            return groupAuth.build()
        }
    )

app.run()
