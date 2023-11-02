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
import {configureDb} from "./db/configure.db";
import {requestContext} from "./db/middlewares/requestContext";
import configDb from "./mikro-orm.config";


// VOIR LA SECTION METADONNEE POUR ELIMINE DANS LE FUTURE LA DEPENDANCE REFLECT METADATA
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/

// pg-promise: https://www.npmjs.com/package/pg-promise


/*
    Lorsque cela arrivera dans la CI supprimer tout les fichiers de configuration autogénérer....

    First :
    Créer une action Auth0 insérant les ids dans la bdd dans la table user en tant que clé primaire:
    https://auth0.com/docs/customize/actions/write-your-first-action
    https://auth0.com/docs/customize/actions/flows-and-triggers/post-user-registration-flow

    Mettre à jour vue.js
 */


/*
    Front end: afficher les erreurs
    Toaster vue.js : https://vue-toastification.maronato.dev/?ref=madewithvuejs.com
 */

/*
    Ce que je veux s'est offrir aux utilisateurs de customiser leurs commandes (commandes par défaut),
    leur permettre de créer leurs commandes, et enfin répondre à des événements à l'aide de code.

    Supertest, jest correspond plus à la philosophie histoire de l'article : Story versus specification dans https://en.wikipedia.org/wiki/Behavior-driven_development

    Pour les aspects techniques (par exemple package core), cela serra plus des TUs.
    Nom de la classe suivi de la methode suivi de 'should X'
    Autrement BDD pour les aspects fonctionnels, test d'intégration...

    Créer un bot de modération / diffusion d'actualité
    Bot modération existant: MEE6, YAGPDB, Dyno, Carl-bot,

    S'intérésser au tdd et les mettre en oeuvre dans ce projet ...

    Pour les autres APIs, créer un toaster indiquant qu'il faut une reconnection
    Au niveau des bots, idem avec un bouton de reconnection

    Créer un package swagger ui

    Monetisation : https://discord.com/developers/docs/monetization/entitlements#premiumrequired-interaction-response

    Seed des ids ou non ?

    Voir comment on peut mettre en place le concept de "linking" pour auth0
    Voir: https://auth0.com/docs/manage-users/user-accounts/user-account-linking

    Vaux mieux que je crée un bot abstrayant les details des interactions. Le bot avant ses details et interargissent en fonction
    Les details se trouveront dans mon api. Comme cela je pourrais utiliser les différentes connection aux differentes plateforme.
    (linking)

    Les configurations n'ont rien à faire dans les packages, mais c'est dans app que je dois le faire
    il ne doit plus y avoir aucune dépendance à inversify. Pour cela je crée des classes à part et les étend avec un injectable

    Créer un custom database auth0
    Auto générer un sdk dans un package. Configurer la synchro des commandes turbo repos pour prendre en compte les changements

    UI:
    Grosso modo, il va falloir se concentrer sur la logique de configuration globale des guilds, channels....
    Il faudra avoir les connections aux différentes plateformes (youtube, instagram...)
    Manager les permissions des bots (qui à le droit de pouvoir gérer les bots)
    Pour determiner le design de la bdd, il faudra bien réfléchir à l'interface --> afficher les données (oublier la partie ui)


    Chaque bot serra responsable de deployer et supprimer ses propres commandes. Cela se fera lors du processus d'invitation
    du bot. Je dois avoir la possibilité de pouvoir, à partir de ces bots récupérer les commandes enregistrées dans discord
    et les insérer dans la base de données.

    Gérer le seeding (activation, désactivation des commandes par défaut)

    Workflow

    Un utilisateur arrive sur une page listant les serveurs. Un bouton apparaitra sous chaque serveur.
    Ce bouton aura deux états :
        - Configurer : cela veut dire que le bot est déjà présent dans le salon
        - Inviter : il n'est pas présent dans le salon

    En cliquant sur inviter : Invite le bot sur le serveur.
    En cliquant sur administrer :
        Je récupère l'intégralité des commandes préexistantes enregistré en bdd,
        J'ajoute les nouvelles et je PUT

    Va falloir que je sécurise les connections (application -> github, application -> openapi.json, user -> swagger)

    ------ PRIORITE ---
    Gestion des connections aux réseaux sociaux ou différentes plateformes avec notifications de reconnection
    si une des plateformes perd la connection

    Gestion des bots (niveau global --> fonctionnalité à spécifier)
    section modération
    section flux (gestion des flux rss, diffusion d'article wordpress, twitch....)
    section planification (se brancher à google calandar pour recevoir des notifs)
    section musique
    section ticketing
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
        description: 'Une description',
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
), configureUser, configureAuth0DiscordService, configureDb(configDb))

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
    .use(requestContext)
    .mapEndpoints()

app.use(errorHandler)

app.run({port: process.env.PORT})

export {app}
