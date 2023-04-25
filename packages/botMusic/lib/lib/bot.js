"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
var discord_js_1 = require("discord.js");
var commands_1 = require("./commands/decorators/commands");
var rest_1 = require("discord-api-types/rest");
var rest_2 = require("@discordjs/rest");
var discord_api_1 = __importDefault(require("./config/discord.api"));
var CommandManager_1 = require("./commands/CommandManager");
var ButtonManager_1 = require("./buttons/ButtonManager");
var Bot = /** @class */ (function () {
    function Bot(config) {
        this._commandManager = new CommandManager_1.CommandManager();
        this._buttonManager = new ButtonManager_1.ButtonManager();
        this._client = new discord_js_1.Client({ intents: config.intents });
        this._rest = new rest_2.REST(discord_api_1.default).setToken(config.token);
        this._client.on('ready', function (c) {
            console.log("".concat(c.user.tag, " est pr\u00EAt a vous servir"));
        });
    }
    Bot.prototype.bootstrap = function (commandsClasses, buttons) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._client.login(process.env.TOKEN_DISCORD)];
                    case 1:
                        _a.sent();
                        this._commandManager.registerCommands(commandsClasses);
                        this._buttonManager.registerButtons(buttons);
                        this._client.on('interactionCreate', function (interaction) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!interaction.isButton()) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this._handleButtonInteraction(interaction)];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2:
                                        if (!interaction.isCommand()) return [3 /*break*/, 4];
                                        return [4 /*yield*/, this._handleCommandInteraction(interaction)];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        });
    };
    Bot.prototype._handleButtonInteraction = function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var button, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        button = this._buttonManager.buttons.get(interaction.customId);
                        if (!button) {
                            console.error("No button matching ".concat(interaction.customId, " was found."));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, button.execute(interaction)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        console.log(err_1);
                        return [4 /*yield*/, this._sendErrorMessage(interaction)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Bot.prototype._handleCommandInteraction = function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var command, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        command = this._commandManager.getCommandByInteraction(interaction);
                        if (!command) {
                            console.error("No command matching ".concat(interaction.commandName, " was found."));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, command.execute(interaction)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        console.error(error_1);
                        return [4 /*yield*/, this._sendErrorMessage(interaction)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Bot.prototype._sendErrorMessage = function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var errorMessage, messageOptions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        errorMessage = 'There was an error while executing this command!';
                        messageOptions = { ephemeral: true };
                        if (!(interaction.replied || interaction.deferred)) return [3 /*break*/, 2];
                        return [4 /*yield*/, interaction.followUp(__assign({ content: errorMessage }, messageOptions))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, interaction.reply(__assign({ content: errorMessage }, messageOptions))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Bot.prototype.deployCommands = function () {
        return __awaiter(this, void 0, void 0, function () {
            var body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = commands_1.commands.map(function (command) { return command.data.toJSON(); });
                        return [4 /*yield*/, this._rest.put(rest_1.Routes.applicationGuildCommands(process.env.CLIENT_ID || '', process.env.GUI_ID || ''), { body: body }).catch(function (error) {
                                console.log(error);
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Bot;
}());
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map