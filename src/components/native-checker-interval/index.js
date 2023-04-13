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
const native_request_1 = __importDefault(require("../native-request"));
const sleep = require('sleep-promise');
const nativeRequestInterval = ({ url, interval, headers, method, body, nextProxy, goodProxy, badProxy, indicator, debug, timeout, stream }) => {
    const instance = () => __awaiter(void 0, void 0, void 0, function* () {
        const proxy = nextProxy();
        if (proxy === 'not found') {
            debug && console.log('Not found proxy for checking');
            yield sleep(10000);
            return;
        }
        const _url = typeof (url) === 'function'
            ? url(proxy)
            : url;
        const _headers = typeof (headers) === 'function'
            ? headers(proxy)
            : headers;
        const _method = typeof (method) === 'function'
            ? method(proxy)
            : method;
        const _body = typeof (body) === 'function'
            ? body(proxy)
            : body;
        const _timeout = typeof (timeout) === 'function'
            ? timeout(proxy)
            : timeout;
        const isGood = yield (0, native_request_1.default)({
            url: _url,
            headers: _headers,
            method: _method,
            body: _body,
            timeout: _timeout,
            proxy,
            debug,
            indicator
        });
        if (isGood) {
            goodProxy(proxy);
        }
        else {
            badProxy(proxy);
        }
    });
    let stop = false;
    const stopFun = () => stop;
    (() => __awaiter(void 0, void 0, void 0, function* () {
        for (; !stopFun();) {
            if (stopFun()) {
                console.log('stop');
                return;
            }
            const _stream = typeof (stream) === 'function'
                ? stream()
                : stream;
            const _interval = typeof (interval) === 'function'
                ? interval()
                : interval;
            yield Promise.all(Array(_stream)
                .fill(1)
                .map(() => instance()));
            yield sleep(_interval);
        }
    }))();
    return () => stop = true;
};
exports.default = nativeRequestInterval;
