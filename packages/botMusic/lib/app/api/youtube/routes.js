"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constructQueryParameters = function (parameters) { return Object
    .keys(parameters)
    .map(function (key) { return "".concat(key, "=").concat(encodeURIComponent(parameters[key])); })
    .join('&'); };
exports.default = {
    channel: function (_a) {
        var _b = _a.parameters, parameters = _b === void 0 ? {} : _b;
        return "channels/?".concat(constructQueryParameters(parameters));
    }
};
//# sourceMappingURL=routes.js.map