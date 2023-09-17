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
import {MetadataTag} from "./openapi/metadata/metadataTag";
import {MetadataProduce} from "./openapi/metadata/metadataProduce";
import {StatutCodes} from "./http/StatutCodes";
import {OpenApiBadRequestObject} from "./http/errors/BadRequest"; // Je ne sais pas...

// Swagger ui Module
import {useSwaggerUI} from "./swagger-ui";
import {OpenapiProp} from "./openapi/decorators/openapi.prop";

// Api CORE
import {IsInt, IsNotEmpty, IsString} from "class-validator";


// Mon App
import {AuthService} from "./auth/auth.service";

// Cela serra native à mon 'core'
import {AuthMetadata} from "./openapi/metadata/authMetadata";
import {auth} from "express-oauth2-jwt-bearer";


// Peut être supprimer carrément IRequestConvention et tout centraliser dans les metadatas
// Revoir absolument le mécanisme, il est trop complexe. Faut pas que je passe par des metadata
// Mon API Core doit avoir la possibilité de construire une authentification et rajouter des informations
// sur chaque route ou groupe et route. L'authentification serra configurer globalement et par défaut
// toutes les routes seront authentifiées.
// Je fournirais une methode AllowAnonymous pour supprimer l'authentification d'une route
// et une methode RequireAuthorization pour spécifier les authorizations necéssaire.
// Grosso modo, toutes les routes créées auront forcément un middleware pour l'autorisation
// J'aurais des décorateurs spécifiques à auth0 pour avoir accés aux informations
// Il faut que je génére une erreur si j'utilise ces fonctionnalitées sans avoir configurer
// l'authentification

// Avoir un comportement commun pour tous les middlewares
class UserRequest {
    @IsInt()
    @IsNotEmpty()
    @OpenapiProp('number', {required: true}) // Générer des erreur pour minLength. Le type doit être de type string ?
    oui!: number /// Pour le type number, faire en sorte de ne pas le rendre obligatoire le passage de paramétre.
                // Si le type est un number et que je rentre integer ou float, générer une erreur


    @IsNotEmpty()
    @IsString()
    @OpenapiProp('string', {required: true}) // Idem que en haut, si c'est un string et que le type est interger ou float alors générer une erreur
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
        @Params('id') id: string,
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
// En fonction de si c'est une conf oaut2 ou jwbear
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
                authorizationUrl: `${process.env.AUTH0_DOMAIN}/authorize?audience=${process.env.AUTH0_AUDIENCE}i&connection=discord`,
                scopes: {}
            },
            implicit: {
                authorizationUrl: `${process.env.AUTH0_DOMAIN}/authorize?audience=${process.env.AUTH0_AUDIENCE}i&connection=discord`,
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



app.addAuthentification(auth({
    issuerBaseURL: process.env.AUTH0_ISSUER,
    audience: process.env.AUTH0_AUDIENCE,
    tokenSigningAlg: process.env.AUTH0_SIGNING_ALG
}), (builder) => {
    builder.addScheme('bearer', 'oauth2')
})

// Vérifier le bon format des routes '/route' au niveau de app endpoint
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
                ).withMetadata(new AuthMetadata(['bearer'])) // Enlever cette partie à mon sens


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
