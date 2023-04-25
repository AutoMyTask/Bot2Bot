"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = exports.commands = void 0;
var discord_js_1 = require("discord.js");
exports.commands = new discord_js_1.Collection();
// Dire que c'est un tableau de BaseCommand
var Commands = function (commandsClasses) {
    commandsClasses.forEach(function (commandClass) {
        var commandPropertyNames = Object.getOwnPropertyNames(commandClass.prototype);
        commandPropertyNames.forEach(function (commandPropertyName) {
            var commandMethod = commandClass.prototype[commandPropertyName];
            var commandMetadata = Reflect.getMetadata('command', commandClass.prototype, commandPropertyName);
            if (commandMetadata) {
                exports.commands.set(commandMetadata.data.name, {
                    data: commandMetadata.data,
                    execute: commandMethod
                });
            }
        });
    });
};
exports.Commands = Commands;
//# sourceMappingURL=commands.js.map