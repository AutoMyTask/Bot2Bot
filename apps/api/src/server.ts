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


// Stocker des metadata pour l'auto documentation
// Vérifier le bon format des routes '/route' au niveau de ... ?
app
    .addEndpoint(routeMapBuilder => {

            routeMapBuilder
                .map('/oui', 'get', (req, res) => {
                    return res.json({oui: true})
                })


            routeMapBuilder
                .map('/non', 'get', (req, res) => {
                    return res.json({oui: false})
                })

            const groupAuth = routeMapBuilder.mapGroup('/ouiNon')


            groupAuth
                .map('/oui', 'get', (req, res) => {
                    res.json({oui: true})
                })


            groupAuth
                .map('/non', "get", (req, res) => {
                    return res.json({oui: false})
                })


            // Je devrais pouvoir faire routeMapBuilder.build() et construire ainsi mes routes
            return routeMapBuilder
        }
    )

app.build()
app.run()
