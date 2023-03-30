import load from './components/load'
import loadInterval from './components/load-interval'
import nativeRequestInterval from './components/native-checker-interval'
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io } from "socket.io-client"

class Proxster {
	private debug: boolean
	private proxys: any[]
	private nextProxy: number
	
	private remotePort: number
	private host: string
	private isRemoteServer: boolean
	private isRemoteClient: boolean
	
	private useProxy: string | null
	private blockedBadProxyTimeout: number
	private refreshGoodProxyTimeout: number

	private socket: any
	private io: any

	constructor(
		options: '' | 
		{ 
			remotePort: number | null, 
			useProxy: string | null
		} = {
			remotePort: null,
			useProxy: null
		}
	) {
		this.debug = false
		this.proxys = []
		this.nextProxy = 0

		this.isRemoteServer = false
		this.isRemoteClient = false
		this.remotePort = 0
		this.host = ''

		this.useProxy = null
		this.blockedBadProxyTimeout = 30000
		this.refreshGoodProxyTimeout = 30000
		
		if (typeof options === 'string') {
			this.remotePort = 0
			this.isRemoteClient = true
			this.host = options
    } else {
			this.useProxy = options.useProxy

			if (options.remotePort) {
				this.remotePort = options.remotePort
				this.isRemoteServer = true
			}
		}
		
		if (this.isRemoteServer) {
			this.socketServer()	
		}

		if (this.isRemoteClient) {
			this.socketClient()
		} 
	}

	public setDebug(debug: boolean) {
		this.debug = debug
	}

 	public async setBlockedBadProxyTimeout(timeout: number) {
		if (this.isRemoteClient) {
			const result = await this.socketClientWrapper('setBlockedBadProxyTimeout', timeout)
			return result
		}

		this.blockedBadProxyTimeout = timeout
	}

	public async setRefreshGoodProxyTimeout(timeout: number) {
		if (this.isRemoteClient) {
			const result = await this.socketClientWrapper('setRefreshGoodProxyTimeout', timeout)
			return result
		}

		this.refreshGoodProxyTimeout = timeout
	}

	private socketServer() {
		const httpServer = createServer();
		this.io = new Server(httpServer, {});

		this.io.on('connection', (socket: any) => {
			socket.on('command', async ({ type, id, args }: { type: string, id: string, args: any }) => {
				// @ts-ignore
				const return_ = await this[type].call(this, ...args)		
				socket.emit('command', { type, id, return_ })	
			})
		})

		httpServer.listen(this.remotePort)
	}

	private socketClient() {
		this.socket = io(this.host, {
			reconnectionDelayMax: 10000,
		})
	}

	public exit () {
		if (this.isRemoteServer) {
			this.io.close()
		} 

		if (this.isRemoteClient) {
			this.socket.close()
		}
	}

	private async socketClientWrapper (type_: string, ...args: any[]) {
		const _id: string = `${Math.random()}-${Math.random()}`

		const result = await new Promise((resolve, reject) => {
			const handler = ({ type, id, return_ }: { type: string, id: string, return_: any }) => {
				if (type === type_ && id === _id) {
					resolve(return_)	
					this.socket.off('command', handler)
				}
			}

			this.socket.on('command', handler)
			this.socket.emit('command', { type: type_, id: _id, args })
		})

		return result
	}

	private pureProxys (proxys: any[]) {
		return proxys
						.map(({ proxy }: { proxy: string }) => proxy)
	}

	private goodProxys (proxys: any[]) {
		// @ts-ignore
		const currentTime = new Date() - 0

		return proxys
						.filter(
							({ isGood, goodTimeout }: { isGood: boolean, goodTimeout: number }) => 
								isGood &&
								goodTimeout > currentTime
						)
	}

	public async load (
		{ 
			timeout, 
			useProxy
		}: { 
			timeout: number, 
			useProxy: string | null
		} = { 
			timeout: 60000, 
			useProxy: null
		}
	) {
		if (this.isRemoteClient) {
			console.log('not available for remote client')
			return null
		} 

		// @ts-ignore
		const currentTime = new Date() - 0

		const proxys = await load({
			useProxy: useProxy || this.useProxy,
			timeout,
			debug: this.debug
		})

		this.proxys = [
			...this.proxys,
			...proxys.filter(_proxy => !this.proxys.find(({ proxy }: { proxy: string }) => proxy === _proxy)).map(
				proxy => ({ 
					proxy, 
					isBlocked: false, 
					isGood: false,
					badTimeout: currentTime,
					goodTimeout: currentTime,
				})
			)
		]

		return this.proxys.length
	}

	public async loadInterval (
		interval: number,
		{ 
			timeout = 60000,
			started = false,
			useProxy = null
		}: { 
			timeout: number,
			started: boolean | undefined,
			useProxy: string | null,
		} = { 
			timeout: 60000,
			started: false,
			useProxy: null
		}
	) {
		if (this.isRemoteClient) {
			console.log('not available for remote client')
			return null
		}
		
		// @ts-ignore
		const currentTime = new Date() - 0

		const kill = loadInterval((proxys: string[]) => {
			this.proxys = [
				...this.proxys,
				...proxys.filter(_proxy => !this.proxys.find(({ proxy }: { proxy: string }) => proxy === _proxy)).map(
					proxy => ({ 
						proxy, 
						isBlocked: false, 
						isGood: false,
						badTimeout: currentTime,
						goodTimeout: currentTime,
					})
				)
			]
		}, 
		interval, 
		{ 
			timeout,
			started,
			useProxy: useProxy || this.useProxy,
			debug: this.debug
		})

		return kill
	}

	public async checkInterval (
		url: string, 
		interval: number, 
		{
			timeout = 10000,
			method = 'GET',
			headers = {},
			body = undefined,
			stream = 10,
      indicator = () => true
		}: {
			timeout: number,
			method: string,
			headers: object,
			body: any,
      stream: number,
			indicator: Function,
		} = { 
			timeout: 10000,
			method: 'GET',
			headers: {},
			body: undefined,
      stream: 10,
			indicator: () => true
		}
	) {
		if (this.isRemoteClient) {
			console.log('not available for remote client')
			return null
		} 
		
		if (this.proxys.length === 0) {
			new Error("Not loaded proxys for checking, read documentation"); 
		}

		const goodProxy = (_proxy: string) => {
			// @ts-ignore
			const currentTime = new Date() - 0
			this.proxys = this.proxys.map(
				proxy => proxy.proxy === _proxy 
					? ({
						...proxy,
						isGood: true,
						isBlocked: false,
						goodTimeout: currentTime + this.refreshGoodProxyTimeout,
						badTimeout: 0
					})
					: proxy
			)
		}

		const badProxy = (_proxy: string) => {
			// @ts-ignore
			const currentTime = new Date() - 0
			this.proxys = this.proxys.map(
				proxy => proxy.proxy === _proxy 
					? ({
						...proxy,
						isGood: false,
						isBlocked: true,
						goodTimeout: 0,
						badTimeout: currentTime + this.blockedBadProxyTimeout
					})
					: proxy
			)
		}

		const nextProxy = () => {
			// @ts-ignore
			const currentTime = new Date() - 0
			
			const proxys = this.proxys
												.filter(
													({ 
														isGood, 
														isBlocked,
														goodTimeout,
                            badTimeout
                          }: { 
														isGood: boolean, 
														isBlocked: boolean,
														goodTimeout: number,
                            badTimeout: number 
													}) => ((!isGood || isBlocked) && (goodTimeout < currentTime || badTimeout < currentTime))
												)

			try {
				if (this.nextProxy > proxys.length) {
					this.nextProxy = 0
				}
				const proxy = proxys[this.nextProxy].proxy
				this.nextProxy++
				return proxy
			} catch (error) {
				return 'not found'
			}
		}

		const kill = nativeRequestInterval(url, interval, {
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
		})

		return kill
	}

	public async cancel (_proxy: string) {
		if (this.isRemoteClient) {
			const result = await this.socketClientWrapper('cancel', _proxy)
			return result
		} 

		// @ts-ignore
		const currentTime = new Date() - 0
		this.proxys = this.proxys.map(
			proxy => proxy.proxy === _proxy 
				? ({
					...proxy,
					isGood: false,
					isBlocked: true,
					goodTimeout: 0,
					badTimeout: currentTime + this.blockedBadProxyTimeout
				})
				: proxy
		)
	}

	public async wait ({ minimumProxyCount, interval }: { minimumProxyCount: number, interval: number } = { minimumProxyCount: 10, interval: 5000 }) {
		if (this.isRemoteClient) {
			const result = await this.socketClientWrapper('wait', { minimumProxyCount, interval })
			return result
		} 
		
		const result = await new Promise(resolve => {
			const checker = () => {
				if (this.goodProxys(this.proxys).length >= minimumProxyCount) {
					resolve(true)
				} else {
					setTimeout(checker, interval)
				}
			}
			checker()
		})
		return result
	}

	public async all ({ filter: { port }}: { filter: { port: number | null } } = { filter: { port: null } }) {
		if (this.isRemoteClient) {
			const result = await this.socketClientWrapper('all', { filter: { port } })
			return result
		} 

		const result = await new Promise(resolve => {
			resolve(
				this.pureProxys(
					this.goodProxys(
						this.proxys
					)
				)
			)
		})
		return result
	}

	public async random () {
		if (this.isRemoteClient) {
			const result = await this.socketClientWrapper('random')
			return result
		} 
		
		const result = await new Promise(resolve => {
			const intervalId = setInterval(() => {
				const proxys = this.pureProxys(
					this.goodProxys(
						this.proxys
					)
				)
	
				// @ts-ignore
				const proxy = proxys[parseInt(Math.random() * proxys.length)]
						
				if (proxy) {
					resolve(proxy)
					clearInterval(intervalId)
				}
			}, 1000)
		})
		return result
	}
}

module.exports = Proxster