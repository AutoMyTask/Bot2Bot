"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/rest/v9");
const rest_2 = require("./youtube/rest");
const routes_1 = __importDefault(require("./youtube/routes"));
exports.default = (config) => ({
    discord: {
        rest: new rest_1.REST(config.discord).setToken(process.env.TOKEN_DISCORD ? process.env.TOKEN_DISCORD : ''),
        routes: v9_1.Routes
    },
    youtube: {
        rest: new rest_2.Rest(config.youtube),
        routes: routes_1.default
    },
});
//# sourceMappingURL=index.js.map