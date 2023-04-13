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
const load_1 = __importDefault(require("./components/load"));
const load_interval_1 = __importDefault(require("./components/load-interval"));
const native_checker_interval_1 = __importDefault(require("./components/native-checker-interval"));
class Proxster {
    constructor({ useProxy = null, blockedBadProxyTimeout = 30000, refreshGoodProxyTimeout = 30000, debug = false } = {
        useProxy: null,
        blockedBadProxyTimeout: 30000,
        refreshGoodProxyTimeout: 30000,
        debug: false
    }) {
        this.debug = false;
        this.stack = [];
        this.nextProxy = 0;
        this.blockedBadProxyTimeout = blockedBadProxyTimeout;
        this.refreshGoodProxyTimeout = refreshGoodProxyTimeout;
        this.useProxy = useProxy;
        this.debug = debug;
    }
    setDebug(debug) {
        this.debug = debug;
    }
    setBlockedBadProxyTimeout(timeout) {
        this.blockedBadProxyTimeout = timeout;
    }
    setRefreshGoodProxyTimeout(timeout) {
        this.refreshGoodProxyTimeout = timeout;
    }
    pureProxys(proxys) {
        return proxys
            .map(({ proxy }) => proxy);
    }
    goodProxys(proxys) {
        // @ts-ignore
        const currentTime = new Date() - 0;
        return proxys
            .filter(({ isGood, goodTimeout }) => isGood &&
            goodTimeout > currentTime);
    }
    _goodProxy(_proxy) {
        // @ts-ignore
        const currentTime = new Date() - 0;
        this.stack = this.stack.map(proxy => proxy.proxy === _proxy
            ? (Object.assign(Object.assign({}, proxy), { isGood: true, isBlocked: false, goodTimeout: currentTime + this.refreshGoodProxyTimeout, badTimeout: 0 }))
            : proxy);
    }
    _badProxy(_proxy) {
        // @ts-ignore
        const currentTime = new Date() - 0;
        this.stack = this.stack.map(proxy => proxy.proxy === _proxy
            ? (Object.assign(Object.assign({}, proxy), { isGood: false, isBlocked: true, goodTimeout: 0, badTimeout: currentTime + this.blockedBadProxyTimeout }))
            : proxy);
    }
    _nextProxy() {
        // @ts-ignore
        const currentTime = new Date() - 0;
        const proxys = this.stack
            .filter(({ isGood, isBlocked, goodTimeout, badTimeout }) => ((!isGood || isBlocked) && (goodTimeout < currentTime || badTimeout < currentTime)));
        try {
            if (this.nextProxy > proxys.length) {
                this.nextProxy = 0;
            }
            const proxy = proxys[this.nextProxy].proxy;
            this.nextProxy++;
            return proxy;
        }
        catch (error) {
            return 'not found';
        }
    }
    load({ timeout, useProxy } = {
        timeout: 60000,
        useProxy: null
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            const currentTime = new Date() - 0;
            const proxys = yield (0, load_1.default)({
                useProxy: useProxy || this.useProxy,
                timeout,
                debug: this.debug
            });
            this.stack = [
                ...this.stack,
                ...proxys.filter(_proxy => !this.stack.find(({ proxy }) => proxy === _proxy)).map(proxy => ({
                    proxy,
                    isBlocked: false,
                    isGood: false,
                    badTimeout: currentTime,
                    goodTimeout: currentTime,
                }))
            ];
            return this.stack.length;
        });
    }
    loadInterval(interval = 5000, { timeout = 60000, started = false, useProxy = null } = {
        timeout: 60000,
        started: false,
        useProxy: null
    }) {
        // @ts-ignore
        const currentTime = new Date() - 0;
        const kill = (0, load_interval_1.default)({
            callback: (proxys) => {
                this.stack = [
                    ...this.stack,
                    ...proxys.filter(_proxy => !this.stack.find(({ proxy }) => proxy === _proxy)).map(proxy => ({
                        proxy,
                        isBlocked: false,
                        isGood: false,
                        badTimeout: currentTime,
                        goodTimeout: currentTime,
                    }))
                ];
            },
            interval,
            timeout,
            started,
            useProxy: useProxy || this.useProxy,
            debug: this.debug
        });
        return kill;
    }
    checkInterval(url = 'https://google.com', interval = 60000, { timeout = 10000, method = 'GET', headers = {}, body = undefined, stream = 10, indicator = () => true } = {
        timeout: 10000,
        method: 'GET',
        headers: {},
        body: undefined,
        stream: 10,
        indicator: () => true
    }) {
        if (this.stack.length === 0) {
            new Error("Not loaded proxys for checking, read documentation");
        }
        const kill = (0, native_checker_interval_1.default)({
            url,
            interval,
            method,
            headers,
            timeout,
            body,
            stream,
            debug: this.debug,
            nextProxy: () => this._nextProxy(),
            goodProxy: (proxy) => this._goodProxy(proxy),
            badProxy: (proxy) => this._badProxy(proxy),
            indicator
        });
        return kill;
    }
    cancel(_proxy) {
        this._badProxy(_proxy);
    }
    wait({ minimumProxyCount, interval } = { minimumProxyCount: 10, interval: 5000 }) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield new Promise(resolve => {
                const checker = () => {
                    if (this.goodProxys(this.stack).length >= minimumProxyCount) {
                        resolve(true);
                    }
                    else {
                        setTimeout(checker, interval);
                    }
                };
                checker();
            });
            return result;
        });
    }
    all({ filter: { port } } = { filter: { port: null } }) {
        return this.pureProxys(this.goodProxys(this.stack));
    }
    random() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield new Promise(resolve => {
                const intervalId = setInterval(() => {
                    const proxys = this.pureProxys(this.goodProxys(this.stack));
                    // @ts-ignore
                    const proxy = proxys[parseInt(Math.random() * proxys.length)];
                    if (proxy) {
                        resolve(proxy);
                        clearInterval(intervalId);
                    }
                }, 1000);
            });
            return result;
        });
    }
}
module.exports = Proxster;
