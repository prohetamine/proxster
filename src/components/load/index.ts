const moment = require('moment')
    , nf = require('node-fetch')
    , HttpsProxyAgent = require('https-proxy-agent')
    , { SocksProxyAgent } = require('socks-proxy-agent')

const checkerproxy = async (debug: boolean, timeout: number, proxy?: string | null): Promise<string[]> => {
  const date = moment().format(`YYYY-MM`) + '-' + moment().format(`DD`)

  const controller = new AbortController()

  const timeId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const data = await nf(`https://checkerproxy.net/api/archive/${date}`, { 
      agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
      signal: controller.signal 
    }).then((data: { json: Function }) => data.json())
    clearTimeout(timeId)
    return data.map((ip: { addr: string }) => ip.addr)
  } catch (e) {
    clearTimeout(timeId)
    debug && console.log('checkerproxy load error')
    return []
  }
}

const checkerproxyPrevDay = async (debug: boolean, timeout: number, proxy?: string | null): Promise<string[]> => {
  const date = moment().format(`YYYY-MM`) + '-' + (parseInt(moment().format(`DD`)) - 1)
  
  const controller = new AbortController()

  const timeId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const data = await nf(`https://checkerproxy.net/api/archive/${date}`, { 
      agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
      signal: controller.signal 
    }).then((data: { json: Function }) => data.json())
    clearTimeout(timeId)
    return data.map((ip: { addr: string }) => ip.addr)
  } catch (e) {
    clearTimeout(timeId)
    debug && console.log('checkerproxy load error')
    return []
  }
}

const topProxies = async (debug: boolean, timeout: number, proxy?: string | null): Promise<string[]> => {
  const controller = new AbortController()

  const timeId = setTimeout(() => {
    controller.abort()
  }, timeout) 
  
  try {
    const data = await nf(`https://top-proxies.ru/free_proxy/fre_proxy_api.php`, { 
      agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
      signal: controller.signal 
    }).then((data: { text: Function }) => data.text())
    clearTimeout(timeId)
    return data.match(/.+/gi)
  } catch (e) {
    clearTimeout(timeId)
    debug && console.log('top-proxies load error')
    return []
  }
}

const freeProxyList = async (debug: boolean, timeout: number, proxy?: string | null): Promise<string[]> => {
  const controller = new AbortController()

  const timeId = setTimeout(() => {
    controller.abort()
  }, timeout) 
  
  try {
    const data = await nf(`https://free-proxy-list.net`, { 
      agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
      signal: controller.signal 
    }).then((data: { text: Function }) => data.text())
    clearTimeout(timeId)
    return data.match(/\d+\.\d+\.\d+\.\d+:\d+/gi)
  } catch (e) {
    clearTimeout(timeId)
    debug && console.log('free-proxy-list load error')
    return []
  }
}

const proxyList = async (debug: boolean, timeout: number, proxy?: string | null): Promise<string[]> => {
  const controller = new AbortController()

  const timeId = setTimeout(() => {
    controller.abort()
  }, timeout) 
  
  try {
    const data = await nf(`https://www.proxy-list.download/api/v2/get?l=en&t=http`, { 
      agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
      signal: controller.signal 
    }).then((data: { json: Function }) => data.json())
    clearTimeout(timeId)
    return data.LISTA.map(({ IP, PORT }: { IP: string, PORT: string }) => IP+':'+PORT)
  } catch (e) {
    clearTimeout(timeId)
    debug && console.log('proxy-list load error')
    return []
  }
}


const proxyscrape = async (debug: boolean, timeout: number, proxy?: string | null): Promise<string[]> => {
  const controller = new AbortController()

  const timeId = setTimeout(() => {
    controller.abort()
  }, timeout) 
  
  try {
    const data = await nf(`https://api.proxyscrape.com/proxytable.php?nf=true&country=all`, { 
      agent: proxy ? proxy.match(/http/) ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy) : undefined,
      signal: controller.signal 
    }).then((data: { json: Function }) => data.json())
    clearTimeout(timeId)
    return Object.keys(data.http)
  } catch (e) {
    clearTimeout(timeId)
    debug && console.log('proxy-list load error')
    return []
  }
}

const load = async ({ debug = false, timeout = 60000, useProxy }: { debug: boolean, timeout: number, useProxy?: string | null }) => {
  const checkerproxyData: string[] = await checkerproxy(debug, timeout, useProxy)
      , checkerproxyPrevDayData: string[] = await checkerproxyPrevDay(debug, timeout, useProxy)
      , topProxiesData: string[] = await topProxies(debug, timeout, useProxy)
      , freeProxyListData: string[] = await freeProxyList(debug, timeout, useProxy)
      , proxyListData: string[] = await proxyList(debug, timeout, useProxy)
      , proxyscrapeData: string[] = await proxyscrape(debug, timeout, useProxy)

  let parseProxys: string[] = [
    ...checkerproxyData,
    ...checkerproxyPrevDayData,
    ...topProxiesData,
    ...freeProxyListData,
    ...proxyListData,
    ...proxyscrapeData
  ]

  parseProxys = Object.keys(
    parseProxys.reduce(
      (ctx: Record<string, any>, proxy: string): object => {
        ctx[proxy] = true
        return ctx
      }, {}
    )
  )

  return parseProxys
}

export default load