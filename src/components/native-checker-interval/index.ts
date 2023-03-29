import nativeRequest from '../native-request'
const sleep = require('sleep-promise')

const nativeRequestInterval = (
    url: string,
    interval: number,
    {
      headers = {},
      method = "GET",
      body = undefined,
      nextProxy = () => {},
      goodProxy = () => {},
      badProxy = () => {},
      indicator = () => true,
      debug = false,
      timeout = 60000,
      stream = 5
    }: {
      headers: object,
      method: string,
      body: any,
      nextProxy: Function,
      goodProxy: Function,
      badProxy: Function,
      indicator: Function,
      debug: boolean,
      timeout: number,
      stream: number
    }
  ) => {
    const instance = async () => {
      const proxy: string = nextProxy()

      if (proxy === 'not found') {
        debug && console.log('Not found proxy for checking')
        await sleep(10000)
        return
      }

      const isGood = await nativeRequest(url, {
        headers,
        method,
        body,
        timeout,
        proxy,
        debug,
        indicator  
      })
  
      if (isGood) {
        goodProxy(proxy)
      } else {
        badProxy(proxy)
      }
    }

    let stop = false
    const stopFun = () => stop

    ;(async () => {
      for (;!stopFun();) {
        if (stopFun()) {
          console.log('stop')
          return 
        }

        await Promise.all(
          Array(stream)
            .fill(true)
            .map(
              () => 
                instance()
            )
          )
        
        await sleep(interval)
      }
    })()

    return () => stop = true
  }

  export default nativeRequestInterval