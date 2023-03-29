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
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const socket_io_client_1 = require("socket.io-client");
class Proxster {
    constructor(options = {
        remotePort: null,
        useProxy: null
    }) {
        this.debug = false;
        this.proxys = [];
        this.nextProxy = 0;
        this.isRemoteServer = false;
        this.isRemoteClient = false;
        this.remotePort = 0;
        this.host = '';
        this.useProxy = null;
        this.blockedBadProxyTimeout = 30000;
        this.refreshGoodProxyTimeout = 30000;
        if (typeof options === 'string') {
            this.remotePort = 0;
            this.isRemoteClient = true;
            this.host = options;
        }
        else {
            this.useProxy = options.useProxy;
            if (options.remotePort) {
                this.remotePort = options.remotePort;
                this.isRemoteServer = true;
            }
        }
        if (this.isRemoteServer) {
            this.socketServer();
        }
        if (this.isRemoteClient) {
            this.socketClient();
        }
    }
    setDebug(debug) {
        this.debug = debug;
    }
    setBlockedBadProxyTimeout(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRemoteClient) {
                const result = yield this.socketClientWrapper('setBlockedBadProxyTimeout', timeout);
                return result;
            }
            this.blockedBadProxyTimeout = timeout;
        });
    }
    setRefreshGoodProxyTimeout(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRemoteClient) {
                const result = yield this.socketClientWrapper('setRefreshGoodProxyTimeout', timeout);
                return result;
            }
            this.refreshGoodProxyTimeout = timeout;
        });
    }
    socketServer() {
        const httpServer = (0, http_1.createServer)();
        this.io = new socket_io_1.Server(httpServer, {});
        this.io.on('connection', (socket) => {
            socket.on('command', ({ type, id, args }) => __awaiter(this, void 0, void 0, function* () {
                // @ts-ignore
                const return_ = yield this[type].call(this, ...args);
                socket.emit('command', { type, id, return_ });
            }));
        });
        httpServer.listen(this.remotePort);
    }
    socketClient() {
        this.socket = (0, socket_io_client_1.io)(this.host, {
            reconnectionDelayMax: 10000,
        });
    }
    exit() {
        if (this.isRemoteServer) {
            this.io.close();
        }
        if (this.isRemoteClient) {
            this.socket.close();
        }
    }
    socketClientWrapper(type_, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const _id = `${Math.random()}-${Math.random()}`;
            const result = yield new Promise((resolve, reject) => {
                const handler = ({ type, id, return_ }) => {
                    if (type === type_ && id === _id) {
                        resolve(return_);
                        this.socket.off('command', handler);
                    }
                };
                this.socket.on('command', handler);
                this.socket.emit('command', { type: type_, id: _id, args });
            });
            return result;
        });
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
    load({ timeout, useProxy } = {
        timeout: 60000,
        useProxy: null
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRemoteClient) {
                console.log('not available for remote client');
                return null;
            }
            // @ts-ignore
            const currentTime = new Date() - 0;
            const proxys = yield (0, load_1.default)({
                useProxy: useProxy || this.useProxy,
                timeout,
                debug: this.debug
            });
            this.proxys = [
                ...this.proxys,
                ...proxys.filter(_proxy => !this.proxys.find(({ proxy }) => proxy === _proxy)).map(proxy => ({
                    proxy,
                    isBlocked: false,
                    isGood: false,
                    badTimeout: currentTime,
                    goodTimeout: currentTime,
                }))
            ];
            return this.proxys.length;
        });
    }
    loadInterval(interval, { timeout = 60000, started = false, useProxy = null } = {
        timeout: 60000,
        started: false,
        useProxy: null
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRemoteClient) {
                console.log('not available for remote client');
                return null;
            }
            // @ts-ignore
            const currentTime = new Date() - 0;
            const kill = (0, load_interval_1.default)((proxys) => {
                this.proxys = [
                    ...this.proxys,
                    ...proxys.filter(_proxy => !this.proxys.find(({ proxy }) => proxy === _proxy)).map(proxy => ({
                        proxy,
                        isBlocked: false,
                        isGood: false,
                        badTimeout: currentTime,
                        goodTimeout: currentTime,
                    }))
                ];
            }, interval, {
                timeout,
                started,
                useProxy: useProxy || this.useProxy,
                debug: this.debug
            });
            return kill;
        });
    }
    checkInterval(url, interval, { timeout = 10000, method = 'GET', headers = {}, body = undefined, stream = 10, indicator = () => true } = {
        timeout: 10000,
        method: 'GET',
        headers: {},
        body: undefined,
        stream: 10,
        indicator: () => true
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRemoteClient) {
                console.log('not available for remote client');
                return null;
            }
            if (this.proxys.length === 0) {
                new Error("Not loaded proxys for checking, read documentation");
            }
            const goodProxy = (_proxy) => {
                // @ts-ignore
                const currentTime = new Date() - 0;
                this.proxys = this.proxys.map(proxy => proxy.proxy === _proxy
                    ? (Object.assign(Object.assign({}, proxy), { isGood: true, isBlocked: false, goodTimeout: currentTime + this.refreshGoodProxyTimeout, badTimeout: 0 }))
                    : proxy);
            };
            const badProxy = (_proxy) => {
                // @ts-ignore
                const currentTime = new Date() - 0;
                this.proxys = this.proxys.map(proxy => proxy.proxy === _proxy
                    ? (Object.assign(Object.assign({}, proxy), { isGood: false, isBlocked: true, goodTimeout: 0, badTimeout: currentTime + this.blockedBadProxyTimeout }))
                    : proxy);
            };
            const nextProxy = () => {
                // @ts-ignore
                const currentTime = new Date() - 0;
                const proxys = this.proxys
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
            };
            const kill = (0, native_checker_interval_1.default)(url, interval, {
                debug: this.debug,
                method,
                headers,
                timeout,
                body,
                nextProxy,
                goodProxy,
                badProxy,
                indicator,
                stream,
            });
            return kill;
        });
    }
    wait({ minimumProxyCount, interval } = { minimumProxyCount: 10, interval: 5000 }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRemoteClient) {
                const result = yield this.socketClientWrapper('wait', { minimumProxyCount, interval });
                return result;
            }
            const result = yield new Promise(resolve => {
                const checker = () => {
                    if (this.goodProxys(this.proxys).length >= minimumProxyCount) {
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
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRemoteClient) {
                const result = yield this.socketClientWrapper('all', { filter: { port } });
                return result;
            }
            const result = yield new Promise(resolve => {
                resolve(this.pureProxys(this.goodProxys(this.proxys)));
            });
            return result;
        });
    }
    random() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRemoteClient) {
                const result = yield this.socketClientWrapper('random');
                return result;
            }
            const result = yield new Promise(resolve => {
                const intervalId = setInterval(() => {
                    const proxys = this.pureProxys(this.goodProxys(this.proxys));
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
