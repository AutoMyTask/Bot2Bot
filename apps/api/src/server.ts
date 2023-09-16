// Au niveau des decorateur générer des erreurs pour guider le développement serai une bonne option
// Ou créer des décorateur plus spécialisé
// ORM: https://github.com/mikro-orm/guide
// Il y a des choses intéréssantes à utiliser dans mon code: https://fettblog.eu/advanced-typescript-guide/


import {App, Body, Params, Service} from "./app.builder";
import express from "express";
import {rateLimiter} from "./middlewares/rate.limiter";
import cors from "./middlewares/cors";
import helmet from 'helmet';

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
import {AuthService} from "./auth/auth.service";
import {jwtCheck} from "./auth/middlewares/jwt.check";
import {AuthMetadata} from "./openapi/metadata/authMetadata";


// revoir absolument le mecanisme, il est trop complexe. Faut pas que je passe par des metadata
// Mon API Core doit avoir la possibilité de construire une authentification et rajouter des informations
// sur chaque route ou groupe et route. L'authentification serra configurer globalement et par défaut
// toute les routes serront authentifié.
// Je fournirais une methode AllowAnonymous pour supprimer l'authentification d'une route
// et une methode RequireAuthorization pour spécifier les authorizations nécéssaire.
// Grosso modo, toute les routes créer auront forcément un middleware pour l'autorization
// J'aurais des décorateur spécifique à auth0 pour avoir accés aux informations

// Avoir un comportement commun pour tous les middlewares
// Supprimer crypto et swagger js doc

class UserRequest {
    @IsInt()
    @IsNotEmpty()
    @OpenapiProp('number', {required: true}) // Générer des erreur pour minLength. Le type doit être de type string ?
    oui!: number


    @IsNotEmpty()
    @IsString()
    @OpenapiProp('string', {required: true})
    non!: string
}

class AuthOuiResponse {
    @OpenapiProp('boolean')
    public oui!: boolean
}


class UserController {
    public static findOne(
        @Params('id', 'float') id: number
    ): AuthOuiResponse {
        return {oui: false}
    }

    public static postUser(
        @Params('id', 'int') id: number,
        @Body userRequest: UserRequest,
        @Service() authService: AuthService
    ): { oui: boolean } {
        console.log(id)
        console.log(userRequest)
        console.log(authService)
        return {oui: true}
    }
}


/**
 * MODULE API CORE
 */
const app = App.createApp({port: process.env.PORT})

// Peut être à revoir pour limiter les marges d'erreurs ?
app.configure(configureOpenApi(builder => {
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
                authorizationUrl: 'https://dev-6s6s0f4wpurx7gmw.eu.auth0.com/authorize?audience=https://automytask/api&connection=discord',
                scopes: {}
            },
            implicit: {
                authorizationUrl: 'https://dev-6s6s0f4wpurx7gmw.eu.auth0.com/authorize?audience=https://automytask/api&connection=discord',
                scopes: {}
            },
        }
    }).addSecurityScheme('bearer', {
        description: 'JWT containing userid claim',
        name: 'Authorization',
        type: 'apiKey',
        in: 'header',
    })
}))


app.configure(services => {
    services.bind(AuthService).toSelf()
})


// Donner la possiblité de donner un handler express ou construire le handler
app
    .addMiddleware(express.json())
    .addMiddleware(express.urlencoded({extended: true}))
    .addMiddleware(rateLimiter)
    .addMiddleware(cors)
    .addMiddleware(helmet({
        contentSecurityPolicy: false
    }))


// Vérifier le bon format des routes '/route' au niveau de ... ?
// Mise en place de test U ? Integration ? Test de la spec swagger via postman ?
// Swagger path auth ne fonctionne pas car il faut ajouter les bonne auth à swagger
app
    .addEndpoint(routeMapBuilder => {
            routeMapBuilder
                .map('/oui/:id', 'get', UserController, UserController.findOne)
                .withMiddleware(jwtCheck)
                .withMiddleware((req, res, next) => {
                    console.log('oui oui je suis un middleware')
                    next()
                })
                .withMetadata(
                    new MetadataProduce(
                        AuthOuiResponse,
                        StatutCodes.Status200OK
                    )
                ).withMetadata(new AuthMetadata(['bearer']))


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


            const authOuiGroup = authGroup
                .mapGroup('/ouiN')
                .withMiddleware((req, res, next) => {
                    console.log('"auth/ouiN" prefix')
                    next()
                }).withMetadata(
                    new MetadataTag('AuthOui', 'AuthOui description')
                )

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
                .map('/oui/:id', 'get', UserController, UserController.findOne)
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

            authNonGroup
                .map('/non/:id', 'get', UserController, UserController.findOne)
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

            return routeMapBuilder
        }
    )
    .extensions(generateOpenApi)


app.mapEndpoints()

app
    .addAppEndpoint((services) => {
        const openAPIObject = services
            .get<OpenApiBuilder>(OpenApiBuilder)
            .getSpec()

        return useSwaggerUI('/docs', openAPIObject)
    }) // Vérifier le bon format du chemin ('/docs'). Peut êre revoir l'archi derriere tout cela
    .addMiddleware(logError) // Je pense supprimer `log error` (il ne sert pas à grand chose)
    .addMiddleware(errorHandler)


// app.build()
app.run()
