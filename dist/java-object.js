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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaObject = void 0;
class JavaObject {
    constructor(objectId, gateway) {
        this.objectId = objectId;
        this.gateway = gateway;
    }
    invoke(methodName, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = `c\n${this.objectId}\n${methodName}\n${args.map(arg => JSON.stringify(arg)).join('\n')}\ne\n`;
            const result = yield this.gateway.send(command);
            return JSON.parse(result);
        });
    }
    get(fieldName) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = `f\n${this.objectId}\n${fieldName}\ne\n`;
            const objectId = yield this.gateway.send(command);
            return new JavaObject(objectId, this.gateway);
        });
    }
    newInstance(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = `n\n${this.objectId}\n${args.map(arg => JSON.stringify(arg)).join('\n')}\ne\n`;
            const objectId = yield this.gateway.send(command);
            return new JavaObject(objectId, this.gateway);
        });
    }
}
exports.JavaObject = JavaObject;
