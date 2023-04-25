"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rest_1 = require("./youtube/rest");
exports.default = (function (config) { return ({
    youtube: {
        rest: new rest_1.Rest(config.youtube),
    },
}); });
//# sourceMappingURL=index.js.map