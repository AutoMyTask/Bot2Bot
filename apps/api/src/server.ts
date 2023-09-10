// import app from "./app"

// app.startBots().catch(err => console.log(err))

// app.app.listen(process.env.PORT, () => {
//     console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
// })

// Utiliser class-validator dans le handler. Il vérifiera la conformité des données du body
// et l'intégralité des validation.... :)


import {App, Body, Params} from "./app.builder";
import express from "express";
import {rateLimiter} from "./middlewares/rate.limiter";
import cors from "./middlewares/cors";
import helmet from 'helmet';
// import start from "bot-music"

// await start()
// Api Core
import {logError} from "./middlewares/log.error"; // // (peut être le supprimer)
import {errorHandler} from "./middlewares/error.handler";
import 'reflect-metadata';


// Open Api Module
import {
    OpenApiBuilder
} from "openapi3-ts/oas31";


// Swagger UI Module
import {configureOpenApi} from "./openapi/configure.openapi";
import {generateOpenApi} from "./openapi/generate.openapi";
import {useAppEndpointSwaggerUI} from "./swagger-ui";
import {MetadataTag} from "./openapi/metadataTag";

// Avoir un comportement commun pour tout les middlewares
// Créer des décorateurs spécifiques à open api

// Pour gérer les erreurs http : http-errors, express-promise-router
// https://www.npmjs.com/package/yup


interface IUserRequest {
    oui?: number
}

// Avoir des decorateurs spécifique au module OpenApi
// Utiliser class validators pour vérifier le bon format d'entrés ?
class UserRequest implements IUserRequest {
    oui: number = 1
    non: boolean = true
}


class UserController {
    // En deuxième clés, se serra pour swagger (les paramètres pour les conventions)
    // Vérifier que l'utilisateur a bien entré un nombre si le params est un nombre
    // Gérer également l'injection de dépendance directement dans les propriétés de la
    // fonction (et oui c'est putin de beau)
    public static findOne(@Params('id') id: number): IAuthOuiResponse {
        // throw createHttpError.BadRequest('eeee')
        return new AuthOuiResponse()
    }

    public static postUser(
        @Params('id') id: number, // Si c'est un nombre, parsé en nombre
        @Body(UserRequest) userRequest: UserRequest // Creer une erreur lorsqu'un utilisateur rentre le mauvais format en utilisant class validator
                                                    // Créer une erreur si j'ai deux bodys (il m'en qu'un seul)
    ): { oui: boolean } {
        return {oui: true}
    }
}


/**
 * MODULE OPENAPI
 * J'utiliserai toute les metadata que je peux enregister dans les metadonnées
 * Autrement je passerai pas des décorateurs
 */
// https://blog.simonireilly.com/posts/typescript-openapi

const openApiBuilder = OpenApiBuilder.create()


interface IAuthOuiResponse {
    oui: boolean
}

class AuthOuiResponse implements IAuthOuiResponse {
    public oui: boolean = true
}


openApiBuilder.addTag({
    name: 'Auth',
    description: 'Une description du groupe',
})

openApiBuilder.addResponse('AuthOuiResponse', {
    description: 'Une description de la réponses',
    content: {
        'application/json': {
            schema: {
                $ref: '#/components/schemas/AuthOuiResponse'
            }
        }
    }
})


openApiBuilder.addPath('/auth/oui/{id}', {
    get: {
        description: 'une description',
        responses: {
            '200': {
                $ref: '#/components/responses/AuthOuiResponse'
            }
        },
        tags: [
            'Auth'
        ]
    },
    post: {
        responses: {
            '200': {
                $ref: '#/components/responses/AuthOuiResponse'
            }
        },
    }
})


/**
 * MODULE API CORE
 */

const app = App.createApp()
app.configure(configureOpenApi({
    title: 'Mon API',
    version: '1.0.0',
    description: 'Une putin de description',
    contact: {
        name: 'François-Pierre ROUSSEAU',
        url: 'mon linkldn',
        email: 'francoispierrerousseau.44@gmail.com'
    }
}))


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
            //   routeMapBuilder
            //       .map('/oui/:id', 'get', UserController, UserController.findOne)
            //       .withMiddleware((req, res, next) => {
            //           console.log('oui oui je suis un middleware')
            //           next()
            //       })


            //    routeMapBuilder
            //        .map('/non/:id', 'get', UserController, UserController.findOne)
            //        .withMiddleware((req, res, next) => {
            //            console.log('non non je suis un middleware')
            //            next()
            //        })

            const authGroup = routeMapBuilder
                .mapGroup('/auth')
                .withMiddleware((req, res, next) => {
                    console.log('"auth" préfix')
                    next()
                })
                .withMetadata(new MetadataTag('Auth', 'Description de Auth'))

            authGroup
                .map('/oui/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            authGroup.map('/oui/:id', 'post', UserController, UserController.postUser)

            authGroup
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            const authOuiGroup = authGroup
                .mapGroup('/ouiN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/ouiN" préfix')
                    next()
                })

            const authNonGroup = authGroup
                .mapGroup('/nonN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/nonN" préfix')
                    next()
                })

            const jajaGroup = authNonGroup
                .mapGroup('/jaja')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/nonN/jaja" préfix')
                    next()
                })
                .withMetadata(new MetadataTag('Jaja'))

            jajaGroup.map('/oui', 'get', UserController, UserController.findOne)

            authNonGroup
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            authNonGroup
                .map('/non', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            authOuiGroup
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })

            return routeMapBuilder
        }
    )
    .extensions(generateOpenApi)


app.mapEndpoints()

app
    .addAppEndpoint((services) => {
        const openAPIObject = services
            .get<OpenApiBuilder>('OpenApiBuilder')
            .getSpec()

        return useAppEndpointSwaggerUI('/docs', openAPIObject)
    }) // Vérifier le bon format du chemin ('/docs')
    .addMiddleware(logError)
    .addMiddleware(errorHandler)


// app.build()
app.run()
