"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
require("reflect-metadata");
function Command(options) {
    return function (target) {
        Reflect.defineMetadata('command', options, target.prototype, 'run');
    };
}
exports.Command = Command;
//# sourceMappingURL=command.js.map