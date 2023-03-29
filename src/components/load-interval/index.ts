import load from '../load'

const loadInterval = (
    callback: Function = () => {},
    interval: number = 5000,
    option: { 
      started?: boolean, 
      debug: boolean,
      timeout: number,
      useProxy?: string | null,
    } = {
      started: false,
      debug: false,
      timeout: 60000,
      useProxy: null,
    }
  ) => {
    const instance = async () => {
      const proxys = await load({
        debug: option.debug,
        timeout: option.timeout,
        useProxy: option.useProxy,
      })
  
      callback(proxys)
    }
  
    option.started && instance()
    const timeId = setInterval(instance, interval)
    return () => clearInterval(timeId)
  }

  export default loadInterval