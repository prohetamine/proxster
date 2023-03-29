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
const load_1 = __importDefault(require("../load"));
const loadInterval = (callback = () => { }, interval = 5000, option = {
    started: false,
    debug: false,
    timeout: 60000,
    useProxy: null,
}) => {
    const instance = () => __awaiter(void 0, void 0, void 0, function* () {
        const proxys = yield (0, load_1.default)({
            debug: option.debug,
            timeout: option.timeout,
            useProxy: option.useProxy,
        });
        callback(proxys);
    });
    option.started && instance();
    const timeId = setInterval(instance, interval);
    return () => clearInterval(timeId);
};
exports.default = loadInterval;
