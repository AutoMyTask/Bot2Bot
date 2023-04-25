"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandManager = void 0;
var commands_1 = require("./decorators/commands");
var CommandManager = /** @class */ (function () {
    function CommandManager() {
    }
    CommandManager.prototype.registerCommands = function (commandsClasses) {
        (0, commands_1.Commands)(commandsClasses);
    };
    CommandManager.prototype.getCommandByInteraction = function (interaction) {
        var command = undefined;
        if (interaction.isButton()) {
            if (interaction.message.interaction) {
                command = commands_1.commands.get(interaction.message.interaction.commandName);
            }
        }
        if (interaction.isCommand()) {
            command = commands_1.commands.get(interaction.commandName);
        }
        return command;
    };
    return CommandManager;
}());
exports.CommandManager = CommandManager;
//# sourceMappingURL=CommandManager.js.map