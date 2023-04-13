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
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const loadInterval = ({ callback, interval, started, timeout, useProxy, debug }) => {
    let isWork = true;
    const instance = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!isWork) {
            return;
        }
        const _interval = typeof (interval) === 'function'
            ? interval()
            : interval;
        const proxys = yield (0, load_1.default)({
            debug,
            timeout,
            useProxy
        });
        callback(proxys);
        yield (0, sleep_promise_1.default)(_interval);
        instance();
    });
    const _interval = typeof (interval) === 'function'
        ? interval()
        : interval;
    if (started) {
        instance();
    }
    const timeId = setInterval(instance, _interval);
    return () => {
        clearInterval(timeId);
        isWork = false;
    };
};
exports.default = loadInterval;
