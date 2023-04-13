const Proxster = require('../src/index')

;(async () => {
  const proxy = new Proxster(/*{
    useProxy: 'http://user98334:ijcf4g@176.100.44.187:9834',
    blockedBadProxyTimeout: 30000,
    refreshGoodProxyTimeout: 30000,
    debug: true
  }*/)

  //console.log('debug', true)
  //proxy.setDebug(true)  

  console.log('setBlockedBadProxyTimeout', '15 min')
  proxy.setBlockedBadProxyTimeout(60000 * 15)
  
  console.log('setRefreshGoodProxyTimeout', '5 min')
  proxy.setRefreshGoodProxyTimeout(60000 * 5)

  /*
  await proxy.load({
    timeout: 100000,
    useProxy: 'http://user98334:ijcf4g@176.100.44.187:9834'
  }) // count proxys
  */

  // console.log(proxy.proxys.length) // proxy count

  console.log('loadInterval', '5 min')
  const killLoad = proxy.loadInterval(60000 * 5, { 
    started: true,
    timeout: 60000,
    useProxy: 'http://user98334:ijcf4g@176.100.44.187:9834'
  })

  /*

  const killLoad = proxy.loadInterval(() => 60000 * 5, { 
    started: true,
    timeout: () => 60000,
    useProxy: () => 'http://user98334:ijcf4g@176.100.44.187:9834'
  })

  */

  const killChecker = await proxy.checkInterval('https://api.ipify.org', 1000, {
    timeout: 30000,
    headers: {}, 
		method: 'GET',
	  //body: undefined,
		stream: 100,
		indicator: (body, proxy, headers, status) => {
      //console.log(proxy, headers, status)
      return status === 200
    }
  })

  await proxy.wait({ minimumProxyCount: 10 })

  setInterval(() => {
    console.log(proxy.all().length)
  }, 1000)

  setTimeout(() => {
    console.log('cancel')
    proxy.all().map(e => proxy.cancel(e))
  }, 60000 * 5)

  console.log(killLoad)
  console.log(killChecker)
  
  console.log(proxy.random())

})()
