import load from '../load'
import sleep from 'sleep-promise'

const loadInterval = (
    { 
      callback,
      interval,
      started, 
      timeout,
      useProxy,
			debug
    }: {
      callback: Function,
      interval: number | Function,
      started: boolean,
      timeout: number | Function
      useProxy: string | null | Function,
			debug: boolean
    }
  ) => {
    let isWork = true

    const instance = async () => {
      if (!isWork) {
        return
      }

      const _interval = typeof(interval) === 'function' 
                          ? interval() 
                          : interval
      
      const proxys = await load({
        debug,
        timeout,
        useProxy
      })
  
      callback(proxys)
      await sleep(_interval)
      instance()
    }
  
    const _interval = typeof(interval) === 'function' 
                          ? interval() 
                          : interval

    if (started) { 
      instance()
    }
    
    const timeId = setInterval(instance, _interval)
    return () => {
      clearInterval(timeId)
      isWork = false
    }
  }

export default loadInterval