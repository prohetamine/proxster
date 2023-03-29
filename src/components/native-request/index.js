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
const nf = require('node-fetch'), HttpsProxyAgent = require('https-proxy-agent');
const nativeRequest = (url, { headers = {}, method = "GET", body = undefined, timeout = 60000, proxy, debug = false, indicator = () => true }) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new AbortController();
    const timeId = setTimeout(() => {
        controller.abort();
    }, timeout);
    try {
        const data = yield nf(url, {
            agent: new HttpsProxyAgent('http://' + proxy),
            headers,
            body,
            method,
            signal: controller.signal
        })
            .then((data) => data.text());
        clearTimeout(timeId);
        return !!indicator(data);
    }
    catch (e) {
        clearTimeout(timeId);
        debug && console.log(`load ${url} error`);
        return false;
    }
});
exports.default = nativeRequest;
