import load from './components/load'
import loadInterval from './components/load-interval'
import nativeRequestInterval from './components/native-checker-interval'

class Proxster {
	private debug: boolean
	private stack: any[]
	private nextProxy: number
	
	private useProxy: string | null
	private blockedBadProxyTimeout: number
	private refreshGoodProxyTimeout: number

	constructor(
 		{
			useProxy = null,
			blockedBadProxyTimeout = 30000,
			refreshGoodProxyTimeout = 30000,
			debug = false
		} : { 
			useProxy: string | null,
			blockedBadProxyTimeout: number,
			refreshGoodProxyTimeout: number,
			debug: boolean
		} = {
			useProxy: null,
			blockedBadProxyTimeout: 30000,
			refreshGoodProxyTimeout: 30000,
			debug: false
		}
	) {
		this.debug = false
		this.stack = []
		this.nextProxy = 0

		this.blockedBadProxyTimeout = blockedBadProxyTimeout
		this.refreshGoodProxyTimeout = refreshGoodProxyTimeout
		this.useProxy = useProxy
		this.debug = debug
	}

	public setDebug(debug: boolean) {
		this.debug = debug
	}

 	public setBlockedBadProxyTimeout(timeout: number) {
		this.blockedBadProxyTimeout = timeout
	}

	public setRefreshGoodProxyTimeout(timeout: number) {
		this.refreshGoodProxyTimeout = timeout
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

	private _goodProxy (_proxy: string) {
		// @ts-ignore
		const currentTime = new Date() - 0
		this.stack = this.stack.map(
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

	private _badProxy (_proxy: string) {
		// @ts-ignore
		const currentTime = new Date() - 0
		this.stack = this.stack.map(
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

	private _nextProxy () {
		// @ts-ignore
		const currentTime = new Date() - 0
		
		const proxys = this.stack
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
		// @ts-ignore
		const currentTime = new Date() - 0
		
		const proxys = await load({
			useProxy: useProxy || this.useProxy,
			timeout,
			debug: this.debug
		})

		this.stack = [
			...this.stack,
			...proxys.filter(_proxy => !this.stack.find(({ proxy }: { proxy: string }) => proxy === _proxy)).map(
				proxy => ({ 
					proxy, 
					isBlocked: false, 
					isGood: false,
					badTimeout: currentTime,
					goodTimeout: currentTime,
				})
			)
		]

		return this.stack.length
	}

	public loadInterval (
		interval: number | Function = 5000,
		{ 
			timeout = 60000,
			started = false,
			useProxy = null
		}: { 
			timeout: number | Function,
			started: boolean,
			useProxy: string | null | Function,
		} = { 
			timeout: 60000,
			started: false,
			useProxy: null
		}
	) {	
		// @ts-ignore
		const currentTime = new Date() - 0

		const kill = loadInterval({
			callback: (proxys: string[]) => {
				this.stack = [
					...this.stack,
					...proxys.filter(_proxy => !this.stack.find(({ proxy }: { proxy: string }) => proxy === _proxy)).map(
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
			timeout,
			started,
			useProxy: useProxy || this.useProxy,
			debug: this.debug
		})

		return kill
	}

	public checkInterval (
		url: string | Function = 'https://google.com', 
		interval: number | Function = 60000, 
		{
			timeout = 10000,
			method = 'GET',
			headers = {},
			body = undefined,
			stream = 10,
      indicator = () => true
		}: {
			timeout: number | Function,
			method: string | Function,
			headers: object | Function,
			body: any | Function,
      stream: number | Function,
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
		if (this.stack.length === 0) {
			new Error("Not loaded proxys for checking, read documentation"); 
		}

		const kill = nativeRequestInterval({
			url, 
			interval,
			method,
			headers,
			timeout,
			body,
			stream,
			debug: this.debug,
			nextProxy: () => this._nextProxy(),
			goodProxy: (proxy: string) => this._goodProxy(proxy),
			badProxy: (proxy: string) => this._badProxy(proxy),
			indicator
		})

		return kill
	}

	public cancel (_proxy: string) {
		this._badProxy(_proxy)
	}

	public async wait ({ minimumProxyCount, interval }: { minimumProxyCount: number, interval: number } = { minimumProxyCount: 10, interval: 5000 }) {
		const result = await new Promise(resolve => {
			const checker = () => {
				if (this.goodProxys(this.stack).length >= minimumProxyCount) {
					resolve(true)
				} else {
					setTimeout(checker, interval)
				}
			}
			checker()
		})
		return result
	}

	public all ({ filter: { port }}: { filter: { port: number | null } } = { filter: { port: null } }) {
		return this.pureProxys(
			this.goodProxys(
				this.stack
			)
		)
	}

	public async random () {	
		const result = await new Promise(resolve => {
			const intervalId = setInterval(() => {
				const proxys = this.pureProxys(
					this.goodProxys(
						this.stack
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