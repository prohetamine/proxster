import nativeRequest from '../native-request'
const sleep = require('sleep-promise')

const nativeRequestInterval = (
    {
      url,
      interval,
      headers,
      method,
      body,
      nextProxy,
      goodProxy,
      badProxy ,
      indicator,
      debug,
      timeout,
      stream
    }: {
      url: string | Function,
      interval: number | Function,
      headers: object | Function,
      method: string | Function,
      body: any | Function,
      nextProxy: Function,
      goodProxy: Function,
      badProxy: Function,
      indicator: Function,
      debug: boolean,
      timeout: number | Function,
      stream: number | Function
    }
  ) => {
    const instance = async () => {
      const proxy: string = nextProxy()

      if (proxy === 'not found') {
        debug && console.log('Not found proxy for checking')
        await sleep(10000)
        return
      }

      const _url = typeof(url) === 'function' 
                      ? url(proxy) 
                      : url

      const _headers = typeof(headers) === 'function' 
                      ? headers(proxy) 
                      : headers

      const _method = typeof(method) === 'function' 
                      ? method(proxy) 
                      : method

      const _body = typeof(body) === 'function' 
                      ? body(proxy) 
                      : body
      
      const _timeout = typeof(timeout) === 'function' 
                      ? timeout(proxy) 
                      : timeout

      const isGood = await nativeRequest({
        url: _url, 
        headers: _headers,
        method: _method,
        body: _body,
        timeout: _timeout,
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

        const _stream = typeof(stream) === 'function' 
                            ? stream() 
                            : stream

        const _interval = typeof(interval) === 'function' 
                            ? interval() 
                            : interval

        await Promise.all(
          Array(_stream)
            .fill(1)
            .map(
              () => 
                instance()
            )
          )
        
        await sleep(_interval)
      }
    })()

    return () => stop = true
  }

  export default nativeRequestInterval