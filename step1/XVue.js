class XVue {
  constructor(options) {
    this.$data = options.data
    this.observe(this.$data)
  }

  observe(value) {
    if (!value || typeof value !== 'object') {
      return
    }
    Object.keys(value).forEach(key => {
      this.defineReactive(value,key,value[key])
    })
  }

  defineReactive(obj, key, val) {
    // 递归查找嵌套属性
    this.observe(val)
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        return val
      },
      set(newVal) {
        if (newVal===val) {
          return
        }
        val = newVal
        console.log('====================================');
        console.log('数据发生变化');
        console.log('====================================');
      }
    })
  }
}