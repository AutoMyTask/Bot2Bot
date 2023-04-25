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
exports.Rest = void 0;
const axios_1 = __importDefault(require("axios"));
// Utilisation de Axios create
class Rest {
    constructor(config) {
        this.get = route => {
            return this.call({ method: 'get', route });
        };
        this.baseUrl = config.baseUrl;
        this.version = config.version;
        Object.setPrototypeOf(this, Rest.prototype);
    }
    call({ method, data, route } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.baseUrl}/${this.version}/${route}`;
            return axios_1.default.request(url, { method, data, withCredentials: false });
        });
    }
}
exports.Rest = Rest;
//# sourceMappingURL=rest.js.map