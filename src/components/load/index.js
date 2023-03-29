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
const moment = require('moment'), nf = require('node-fetch'), HttpsProxyAgent = require('https-proxy-agent'), { SocksProxyAgent } = require('socks-proxy-agent');
const checkerproxy = (debug, timeout, proxy) => __awaiter(void 0, void 0, void 0, function* () {
    const date = moment().format(`YYYY-MM`) + '-' + moment().format(`DD`);
    const controller = new AbortController();
    const timeId = setTimeout(() => {
        controller.abort();
    }, timeout);
    try {
        const data = yield nf(`https://checkerproxy.net/api/archive/${date}`, {
            agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
            signal: controller.signal
        }).then((data) => data.json());
        clearTimeout(timeId);
        return data.map((ip) => ip.addr);
    }
    catch (e) {
        clearTimeout(timeId);
        debug && console.log('checkerproxy load error');
        return [];
    }
});
const checkerproxyPrevDay = (debug, timeout, proxy) => __awaiter(void 0, void 0, void 0, function* () {
    const date = moment().format(`YYYY-MM`) + '-' + (parseInt(moment().format(`DD`)) - 1);
    const controller = new AbortController();
    const timeId = setTimeout(() => {
        controller.abort();
    }, timeout);
    try {
        const data = yield nf(`https://checkerproxy.net/api/archive/${date}`, {
            agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
            signal: controller.signal
        }).then((data) => data.json());
        clearTimeout(timeId);
        return data.map((ip) => ip.addr);
    }
    catch (e) {
        clearTimeout(timeId);
        debug && console.log('checkerproxy load error');
        return [];
    }
});
const topProxies = (debug, timeout, proxy) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new AbortController();
    const timeId = setTimeout(() => {
        controller.abort();
    }, timeout);
    try {
        const data = yield nf(`https://top-proxies.ru/free_proxy/fre_proxy_api.php`, {
            agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
            signal: controller.signal
        }).then((data) => data.text());
        clearTimeout(timeId);
        return data.match(/.+/gi);
    }
    catch (e) {
        clearTimeout(timeId);
        debug && console.log('top-proxies load error');
        return [];
    }
});
const freeProxyList = (debug, timeout, proxy) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new AbortController();
    const timeId = setTimeout(() => {
        controller.abort();
    }, timeout);
    try {
        const data = yield nf(`https://free-proxy-list.net`, {
            agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
            signal: controller.signal
        }).then((data) => data.text());
        clearTimeout(timeId);
        return data.match(/\d+\.\d+\.\d+\.\d+:\d+/gi);
    }
    catch (e) {
        clearTimeout(timeId);
        debug && console.log('free-proxy-list load error');
        return [];
    }
});
const proxyList = (debug, timeout, proxy) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new AbortController();
    const timeId = setTimeout(() => {
        controller.abort();
    }, timeout);
    try {
        const data = yield nf(`https://www.proxy-list.download/api/v2/get?l=en&t=http`, {
            agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
            signal: controller.signal
        }).then((data) => data.json());
        clearTimeout(timeId);
        return data.LISTA.map(({ IP, PORT }) => IP + ':' + PORT);
    }
    catch (e) {
        clearTimeout(timeId);
        debug && console.log('proxy-list load error');
        return [];
    }
});
const proxyscrape = (debug, timeout, proxy) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new AbortController();
    const timeId = setTimeout(() => {
        controller.abort();
    }, timeout);
    try {
        const data = yield nf(`https://api.proxyscrape.com/proxytable.php?nf=true&country=all`, {
            agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
            signal: controller.signal
        }).then((data) => data.json());
        clearTimeout(timeId);
        return Object.keys(data.http);
    }
    catch (e) {
        clearTimeout(timeId);
        debug && console.log('proxy-list load error');
        return [];
    }
});
const load = ({ debug = false, timeout = 60000, useProxy }) => __awaiter(void 0, void 0, void 0, function* () {
    const checkerproxyData = yield checkerproxy(debug, timeout, useProxy), checkerproxyPrevDayData = yield checkerproxyPrevDay(debug, timeout, useProxy), topProxiesData = yield topProxies(debug, timeout, useProxy), freeProxyListData = yield freeProxyList(debug, timeout, useProxy), proxyListData = yield proxyList(debug, timeout, useProxy), proxyscrapeData = yield proxyscrape(debug, timeout, useProxy);
    let parseProxys = [
        ...checkerproxyData,
        ...checkerproxyPrevDayData,
        ...topProxiesData,
        ...freeProxyListData,
        ...proxyListData,
        ...proxyscrapeData
    ];
    parseProxys = Object.keys(parseProxys.reduce((ctx, proxy) => {
        ctx[proxy] = true;
        return ctx;
    }, {}));
    return parseProxys;
});
exports.default = load;
