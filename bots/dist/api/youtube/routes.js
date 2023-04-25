"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructQueryParameters = parameters => Object
    .keys(parameters)
    .map(key => `${key}=${encodeURIComponent(parameters[key])}`)
    .join('&');
exports.default = {
    channel: ({ parameters = {} }) => {
        return `channels/?${constructQueryParameters(parameters)}`;
    }
};
//# sourceMappingURL=routes.js.map