// ORM: https://github.com/mikro-orm/guide
// Il y a des choses intéréssantes à utiliser dans mon code: https://fettblog.eu/advanced-typescript-guide/

import express from "express";
import helmet from 'helmet';
import cors from "cors";
import 'reflect-metadata';
import {auth} from "express-oauth2-jwt-bearer";
import rateLimit from "express-rate-limit";
import {endpoints as userEndpoints} from "./users/endpoints";
import {configure as configureUser} from "./users/configure";
import {configureOpenApi, openApi} from "openapi";
import {configureAuth0} from "auth0";
import {Auth0DiscordService, configureAuth0DiscordService} from "./auth0/auth0.discord.service";
import {configureDiscord} from "discord";
import {AppCore} from "api-core-types";
import {swaggerUi} from "./swaggerUi";
import {OpenApiBuilder} from "openapi";
import {AppBuilder, errorHandler} from "api-core";


// VOIR LA SECTION METADONNEE POUR ELIMINE DANS LE FUTURE LA DEPENDANCE REFLECT METADATA
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/

/*
    TDD:
    Test d'integration : supertest (commencer par tester les routes au début avec swagger parser)
    TU: vitest
 */



/*
    Front end: afficher les erreurs
    Toaster vue.js : https://vue-toastification.maronato.dev/?ref=madewithvuejs.com
 */

/*
    S'intérésser au tdd et bdd et les mettre en oeuvre dans ce projet ...

    Si l'api discord renvoie une erreur style 40O/invalid_credential forcer une déconnexion.

    Pour les autres APIs, créer un toaster indiquant qu'il faut une reconnection
    Au niveau des bots, idem avec un bouton de reconnection


    Les middlewares devront être wrappé dans un HttpContext


    Créer un package swagger ui

    Monetisation : https://discord.com/developers/docs/monetization/entitlements#premiumrequired-interaction-response

    Seed des ids ou non ?

    Voir comment on peut mettre en place le concepte de "linking" pour auth0
    Voir: https://auth0.com/docs/manage-users/user-accounts/user-account-linking


    Les configurations n'ont rien à faire dans les packages, mais c'est dans app que je dois le faire
    il ne doit plus y avoir aucune dépendance à inversify. Pour cela je crée des classes à part et les étend avec un injectable

    Créer un custom database auth0
    Auto générer un sdk dans un package. Configurer la synchro des commandes turbo repos pour prendre en compte les changements

    Grosso modo, il va falloir se concentrer sur la logique de configuration globale des guilds, channels....
    Il faudra avoir les connections aux différentes plateformes (youtube, instagram...)
    Manager les permissions des bots (qui à le droit de pouvoir gérer les bots)

    Pour determiner le design de la bdd, il faudra bien réfléchir à l'interface --> afficher les données (oublier la partie ui)

    Chaque bot serra responsable de deployer et supprimer ses propres commandes. Cela se fera lors du processus d'invitation
    du bot. Je dois avoir la possibilité de pouvoir, à partir de ces bots récupérer les commandes enregistrées dans discord
    et les insérer dans la base de données.

    Gérer le seeding (activation, désactivation des commandes par défaut)

    Le bot n'est pas présent dans la guild ?
    Seeder les commandes par défaut (POST)

    Le bot est présent dans la guild ? (PATCH)
    Ne rien faire, mis à part insérer les nouvelles commandes ajouté pour pas écraser les modifications des utilisateurs

    Va falloir que je sécurise les connections (application -> github, application -> openapi.json, user -> swagger))


    ------ PRIORITE ---
    Connection -> deconnection (gérer si discord/auth0 ne répondent plus, erreur 401...)
    Gestion des connections aux réseaux sociaux ou différentes plateforme avec notifications de reconnection
    si une des plateforme perd la connection
    Gestion des bots (niveau global --> fonctionnalité à spécifier)
    bot modération
    bot flux (gestion des flux rss, diffusion d'article wordpress, twitch....)
    botCalandar (se brancher à google calandar pour recevoir des notifs)
    A voir pour le reste (bot community, bot messenger)
 */


const builder = AppBuilder.createAppBuilder()

builder.configure(configureOpenApi(builder => {
    const urlSearchParameters = new URLSearchParams({
        audience: process.env.AUTH0_AUDIENCE ?? '',
        connection: 'discord'
    })

    const authorizationUrl = `${process.env.AUTH0_DOMAIN}/authorize?${urlSearchParameters.toString()}`
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
                authorizationUrl,
                scopes: {}
            },
            implicit: {
                authorizationUrl,
                scopes: {}
            },
        }
    }).addSecurityScheme('bearer', {
        description: 'JWT containing userid claim',
        name: 'Authorization',
        type: 'apiKey',
        in: 'header',
    })
}), configureAuth0(
    process.env.AUTH0_API_MANAGEMENT_CLIENT_ID ?? '',
    process.env.AUTH0_API_MANAGEMENT_CLIENT_SECRET ?? '',
    process.env.AUTH0_API_MANAGEMENT_AUDIENCE ?? ''
), configureDiscord(
    process.env.DISCORD_API_BOT_AUTOMYTASK_CLIENT_ID ?? '',
    process.env.DISCORD_API_BOT_AUTOMYTASK_CLIENT_SECRET ?? ''
), configureUser, configureAuth0DiscordService)

builder.addAuthentification(auth({
    issuerBaseURL: process.env.AUTH0_ISSUER,
    audience: process.env.AUTH0_AUDIENCE,
    tokenSigningAlg: process.env.AUTH0_SIGNING_ALG
}), ['oauth2', 'bearer'], (builder) => { // Donner accés qu'à une interface pour builder.
    builder.onTokenValidated = (req, res, next) => {
        const auth0DiscordService = req.services.get(Auth0DiscordService)

        if (req.auth?.payload.sub && !auth0DiscordService.hasSub) {
            auth0DiscordService.setSub(req.auth.payload.sub)
        }
        next()
    }
})


const app = builder.build()


app
    .addEndpoints(userEndpoints)
    .useAuthentification()
    .use(openApi)
    .use(swaggerUi(services => services.get(OpenApiBuilder).getSpec()))
    .use((app: AppCore.IApp) => {
        app
            .app.use(
            express.json({
                limit: '1mb'
            }),
            express.urlencoded({extended: true}),
            rateLimit({
                windowMs: 60 * 60 * 60,
                max: 100,
            }),
            cors({
                origin: 'http://localhost:8080'
            }),
            helmet(),
        )
    })
    .mapEndpoints()

app.use(errorHandler)

app.run({port: process.env.PORT})


