const nf = require('node-fetch')
    , HttpsProxyAgent = require('https-proxy-agent')

const nativeRequest = async (
  {
    url,
    headers = {}, 
    method = "GET",
    body = undefined,
    timeout = 60000, 
    proxy,
    debug = false,
    indicator = () => true
  }: {
    url: string,
    headers: object, 
    method: string,
    body: any,
    timeout: number, 
    proxy: string,
    debug: boolean,
    indicator: Function
  }
): Promise<boolean> => {
  const controller = new AbortController()

  const timeId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const data = await nf(url, { 
      agent: new HttpsProxyAgent('http://'+proxy),
      headers,
      body,
      method,
      signal: controller.signal 
    })
    .then(async (data: { text: Function, headers: any, status: Number }) => ({ 
      body: await data.text(),
      headers: data.headers.raw(),
      status: data.status
    }))

    clearTimeout(timeId)
    return !!indicator(data.body, proxy, data.headers, data.status) 
  } catch (e) {
    clearTimeout(timeId)
    debug && console.log(`load ${url} error`)
    return false
  }
}

export default nativeRequest