"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("./config/config"));
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./api/index"));
// Le mieux est de revoir le system d'événement.
// Créer une playlist
// Fonctionnement des commandes par événements
// Historiser les commandes utilisateurs pour une bonne gestion des enchainement des commandes
// L'ordre de l'exécution des commandes est directement implémenté au sein des commandes
// Cela s'effectuera à l'aide d'événements et exécutant l'intégralité de tout ceci dans la méthode exécute
// Tout doit être gérer au niveau du commandService ( event....)
// Insérer au sein du bot uniquement les commands à activer. Pas besoin de module.
// Les commands à activer seront inscrit dans la base de données
// UTILISER TYPESCRIPT POUR LA MAINTENABILITÉ ET LA LISIBILITÉ
// GERER LES ERREURS
// TUs
// ERRORS
// Par exemple pour interaction je peux créer une classe héritant
// d'error et lui passer interaction pour envoyer l'erreur au serveur
// Réfléchir à l'utilisation de typescript pour la maintenabilité
// Nivelé des niveau critiques d'erreurs en fonction
// Réfléchir au test unitaires et d'intégration
// PLAYER YOUTUBE
// Création d'un player à part pour une meilleur gestion des audios
// System d'injection de dépendances des commandes
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    dotenv_1.default.config();
    if (!config_1.default.client)
        throw new Error('Client config must be defined');
    if (!config_1.default.api.discord)
        throw new Error('Config api discord must be defined');
    if (!config_1.default.api.youtube)
        throw new Error('Config api youtube must be defined');
    if (!process.env.TOKEN_DISCORD)
        throw new Error('TOKEN_DISCORD must be defined!');
    if (!process.env.TOKEN_YOUTBE)
        throw new Error('TOKEN_YOUTUBE must be defined');
    if (!process.env.CLIENT_ID)
        throw new Error('CLIENT_ID must be defined');
    if (!process.env.GUI_ID)
        throw new Error('GUI_ID must be defined');
    if (!process.env.PORT)
        throw new Error('PORT must be defined');
    const client = new discord_js_1.Client(config_1.default.client);
    yield client.login(process.env.TOKEN_DISCORD);
    const api = (0, index_1.default)(config_1.default.api);
    const app = (0, express_1.default)();
    app.listen(process.env.PORT, () => {
        console.log('Listening on port 3000!!!!!');
    });
});
start().catch(err => console.log(err));
//# sourceMappingURL=index.js.map