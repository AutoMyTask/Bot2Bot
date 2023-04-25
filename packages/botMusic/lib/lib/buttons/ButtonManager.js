"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonManager = void 0;
var discord_js_1 = require("discord.js");
var ButtonManager = /** @class */ (function () {
    function ButtonManager() {
        this.buttons = new discord_js_1.Collection();
    }
    ButtonManager.prototype.registerButtons = function (buttons) {
        var _this = this;
        buttons.forEach(function (button) {
            _this.buttons.set(button.data.data.custom_id, {
                data: button.data,
                execute: button.run
            });
        });
    };
    return ButtonManager;
}());
exports.ButtonManager = ButtonManager;
//# sourceMappingURL=ButtonManager.js.map