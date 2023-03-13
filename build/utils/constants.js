"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_VERSION = exports.getEnv = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getEnv = (key) => {
    const value = process.env[key];
    if (value == undefined) {
        throw Error(`${key} not found in ENV`);
    }
    return value;
};
exports.getEnv = getEnv;
exports.APP_VERSION = "beta";
