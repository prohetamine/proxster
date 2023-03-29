const Proxster = require('../../src/index')

;(async () => {
  const proxy = new Proxster()

  //proxy.setDebug(true)  

  console.log('setBlockedBadProxyTimeout', '15 min')
  await proxy.setBlockedBadProxyTimeout(60000 * 15)
  
  console.log('setRefreshGoodProxyTimeout', '5 min')
  await proxy.setRefreshGoodProxyTimeout(60000 * 5)

  // await proxy.load() // count proxys

  /*
  
  await proxy.load({
    timeout: 10000,
    useProxy: 'http://user1221:ij2f4g@226.200.44.187:9934'
  }) // count proxys

  */

  console.log('loadInterval', '5 min')
  const killLoad = await proxy.loadInterval(60000 * 5, { started: true })

  /*
    
  const killLoad = await proxy.loadInterval(99999, {
    timeout: 10000,
    useProxy: 'http://127.0.0.1:8080,
    started: true
  })

  */

  console.log('checkInterval', 'url: https://api.ipify.org', '1 sec')
  const killChecker = await proxy.checkInterval('https://api.ipify.org', 1000, {
    timeout: 30000,
    headers: {}, 
		method: 'GET',
	  //body: undefined,
		stream: 100,
		indicator: body => body.match(/\d+\.\d+\.\d+\.\d+/gi)
  })

  /// const killChecker = await proxy.checkInterval('https://api.ipify.org' /* url */, 1000 /* interval */)

  /*
    console.log('killLoad')
    killLoad()
    console.log('killChecker')
    killChecker()
  */

  console.log('wait', 'minimum 10 proxy')
  await proxy.wait({ minimumProxyCount: 10 })
  
  setInterval(async () => {
    console.log('all')
    await proxy.all().then(e => console.log(e))
  }, 10000)

  setInterval(async () => {
    await proxy.random().then(e => console.log('random', e))
  }, 1000)

})()
