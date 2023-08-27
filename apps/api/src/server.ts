// import app from "./app"

// Je veux pouvoir avoir un contrôle sur la construction de mon API
// Je désire qu'elle soit extensible
// Mon app possède des middlewares globales utilisés pour toutes mes requêtes HTTP entrantes
// Mon app permet d'ajouter des endpoints. Ces endpoints utiliseront des callbacks qui s'exécuteront
// à chaque fois qu'un client appèlera un de ces endpoints.
// Ces endpoints posséderont des middlewares utilisés pour un endpoint utilisé par un client
// Ces endpoint peuvent être orgranisé en un seul groupe. Ce groupe possédera des middlewares. C'est-à-dire
// que chaque fois que j'ai l'intention d'appeler un endpoint faisant partie d'un groupe, les middlewares
// associé à ce groupe de middlewares s'exécuteront

// const builder = AppBuilder.createBuilder()
// builder.addModule(users)
// builder.addModule(swagger)
// builder.addMiddleware(....)
// const app = builder.build()
// app.startBots().catch(err => console.log(err))


// app.app.listen(process.env.PORT, () => {
//     console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
// })


import {App} from "./app.builder";
import express from "express";
import {rateLimiter} from "./middlewares/rate.limiter";
import cors from "./middlewares/cors";
import helmet from "helmet";

const app = App.createBuilder()

// Global Middlewares
app
    .addMiddleware(express.json())
    .addMiddleware(express.urlencoded({extended: true}))
    .addMiddleware(rateLimiter)
    .addMiddleware(cors)
    .addMiddleware(helmet())

app
    .addEndpoint(e => e
        .withMiddleware((req, res, next) => {
            next()
        })
        .map('/oui', "get", (req, res) => {
            return res.json({auth: true})
        })
        .build()
    )

app.run()
