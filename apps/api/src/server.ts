// import app from "./app"

// app.startBots().catch(err => console.log(err))

// app.app.listen(process.env.PORT, () => {
//     console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
// })

// Utiliser class-validator dans le handler. Il vérifiera la conformité des données du body
// et l'intégralité des validation.... :)

// Au niveau des decorateur générer des erreurs pour guider le développement serai une bonne option
// Ou créer des décorateur plus spécialisé


import {App, Body, Params} from "./app.builder";
import express from "express";
import {rateLimiter} from "./middlewares/rate.limiter";
import cors from "./middlewares/cors";
import helmet from 'helmet';
// import start from "bot-music"

// await start()
// Api Core
import {logError} from "./middlewares/log.error"; //  (peut être le supprimer)
import {errorHandler} from "./middlewares/error.handler";
import 'reflect-metadata';


// Open Api Module
import {
    OpenApiBuilder
} from "openapi3-ts/oas31";


import {configureOpenApi} from "./openapi/configure.openapi";
import {generateOpenApi} from "./openapi/generate.openapi";
import {useSwaggerUI} from "./swagger-ui";
import {MetadataTag} from "./openapi/metadata/metadataTag";
import {MetadataProduce} from "./openapi/metadata/metadataProduce";
import {StatutCodes} from "./http/StatutCodes";
import {IsInt, IsNotEmpty, IsString} from "class-validator";
import {OpenapiProp} from "./openapi/decorators/openapi.prop";
import {OpenApiBadRequestObject} from "./http/errors/BadRequest";


// Créer peut être une metadata pour gérer les autorisations / authentifications ? Cela me semble pas mal

// Avoir un comportement commun pour tout les middlewares
// Créer des décorateurs spécifiques à open api

// https://www.npmjs.com/package/yup

// Avoir des decorateurs spécifique au module OpenApi
class UserRequest {

    @IsInt()
    @IsNotEmpty()
    @OpenapiProp('number', { required: true }) // Générer des erreur pour minLengt. Le tupe doit
                                                            // être de type string ?
    oui!: number


    @IsNotEmpty()
    @IsString()
    @OpenapiProp('string', { required: true })
    non!: string
}

class AuthOuiResponse {
    @OpenapiProp('boolean')
    public oui!: boolean
}


class UserController {
    // Gérer  l'injection de dépendance directement dans les propriétés de la
    // fonction (et oui c'est putin de beau)
    public static findOne(
        @Params('id', {
            type: 'float'
        }) id: number
    ): AuthOuiResponse {
        // throw createHttpError.BadRequest('eeee')
        return {oui: false}
    }

    public static postUser(
        @Params('id', {
            type: 'int'
        }) id: number,
        @Body() userRequest: UserRequest,
    ): { oui: boolean } {
        return {oui: true}
    }
}



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


// Donner la possiblité de donner un handler express ou construire le handler
app
    .addMiddleware(express.json())
    .addMiddleware(express.urlencoded({extended: true}))
    .addMiddleware(rateLimiter)
    .addMiddleware(cors)
    .addMiddleware(helmet())


// Vérifier le bon format des routes '/route' au niveau de ... ?
// Mise en place de test U ? Integration ? Test de la spec swagger via postman ?
app
    .addEndpoint(routeMapBuilder => {
            routeMapBuilder
                .map('/oui/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )


            routeMapBuilder
                .map('/non/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('non non je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            const authGroup = routeMapBuilder
                .mapGroup('/auth')
                .withMiddleware((req, res, next) => {
                    console.log('"auth" préfix')
                    next()
                })
                .withMetadata(
                    new MetadataTag(
                        'Auth',
                        'Description de Auth'
                    )
                )

            authGroup
                .map('/oui/:id', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            authGroup
                .map('/oui/:id', 'post', UserController, UserController.postUser)
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                ).withMetadata(
                    new MetadataProduce(
                        OpenApiBadRequestObject,
                        StatutCodes.Status400BadRequest
                    )
                )

            authGroup
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            const authOuiGroup = authGroup
                .mapGroup('/ouiN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/ouiN" prefix')
                    next()
                })

            const authNonGroup = authGroup
                .mapGroup('/nonN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/nonN" prefix')
                    next()
                }).withMetadata(
                    new MetadataTag(
                        'AuthNon',
                        'AuthNon description'
                    )
                )

            const jajaGroup = routeMapBuilder
                .mapGroup('/jaja')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/nonN/jaja" prefix')
                    next()
                })
                .withMetadata(
                    new MetadataTag(
                        'Jaja',
                        'une petite description jaja'
                    )
                )

            jajaGroup
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMetadata(
                    new MetadataTag(
                        'Arg',
                        "Une description d'arg "
                    ))
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            authNonGroup
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            authNonGroup
                .map('/non', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

            authOuiGroup
                .map('/oui', 'get', UserController, UserController.findOne)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                )

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

        return useSwaggerUI('/docs', openAPIObject)
    }) // Vérifier le bon format du chemin ('/docs')
    .addMiddleware(logError) // Je pense supprimer `log error` (il ne sert pas à grand chose)
    .addMiddleware(errorHandler)


// app.build()
app.run()
