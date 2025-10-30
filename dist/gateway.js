"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gateway = void 0;
const net = __importStar(require("net"));
const java_object_1 = require("./java-object");
class Gateway {
    constructor(port, host) {
        this.port = port;
        this.host = host;
        this.client = new net.Socket();
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.client.connect(this.port, this.host, () => {
                resolve();
            });
            this.client.on('error', (err) => {
                reject(err);
            });
        });
    }
    disconnect() {
        this.client.destroy();
    }
    send(data) {
        return new Promise((resolve, reject) => {
            this.client.write(data);
            this.client.once('data', (chunk) => {
                resolve(chunk.toString());
            });
            this.client.once('error', (err) => {
                reject(err);
            });
        });
    }
    getEntryPoint() {
        return new java_object_1.JavaObject('e', this);
    }
}
exports.Gateway = Gateway;
