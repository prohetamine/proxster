console.log('client')
const Proxster = require('../../src/index')

const proxy = new Proxster('ws://localhost:3123')

;(async () => {
  console.log('wait', 'minimum 5 proxy')
  await proxy.wait({ minimumProxyCount: 5 })

  setInterval(async () => {
    await proxy.all().then(e => console.log('proxys', e))
  }, 10000)

  setInterval(async () => {
    await proxy.random().then(e => console.log('random', e))
  }, 1000)
})()