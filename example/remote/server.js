console.log('server')
const Proxster = require('../../src/index')

;(async () => {
  const proxy = new Proxster({
    useProxy: 'http://user2334:ijcf4g@146.110.44.187:9334',
    remotePort: 3123
  })

  //proxy.setDebug(true)  

  console.log('setBlockedBadProxyTimeout', '15 min')
  await proxy.setBlockedBadProxyTimeout(60000 * 15)
  
  console.log('setRefreshGoodProxyTimeout', '5 min')
  await proxy.setRefreshGoodProxyTimeout(60000 * 5)

  console.log('loadInterval', '5 min')
  const killLoad = await proxy.loadInterval(60000 * 5, { started: true })

  console.log('checkInterval', 'url: https://api.ipify.org', '1 sec')
  const killChecker = await proxy.checkInterval('https://api.ipify.org', 1000, {
    timeout: 30000,
    headers: {}, 
		method: 'GET',
	  //body: undefined,
		stream: 100,
		indicator: body => body.match(/\d+\.\d+\.\d+\.\d+/gi)
  })

  /*
    console.log('killLoad')
    killLoad()
    console.log('killChecker')
    killChecker()
  */
})()

