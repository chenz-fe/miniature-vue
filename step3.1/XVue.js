class XVue {
  constructor(options) {
    this.$data = options.data;
    this.observe(this.$data);

    // step2测试代码：
    // new Watcher();
    // console.log('模拟compile', this.$data.test);
    
    // step3.1测试代码：
    new Compile(options.el, this)
  }

  observe(value) {
    if (!value || typeof value !== 'object') {
      return;
    }
    Object.keys(value).forEach(key => {
      this.defineReactive(value, key, value[key]);
    });
  }

  defineReactive(obj, key, val) {
    // 递归查找嵌套属性
    this.observe(val);

    // 创建Dep(step2新增)
    const dep = new Dep();

    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        // 收集依赖(step2新增)
        Dep.target && dep.addDep(Dep.target);
        console.log(dep.deps);
        return val;
      },
      set(newVal) {
        if (newVal === val) {
          return;
        }
        val = newVal;
        dep.notify();
      },
    });
  }
}

// 依赖管理器：负责将视图中所有依赖收集管理，包括依赖添加和通知
class Dep {
  constructor() {
    // deps里面存放的是Watcher的实例
    this.deps = [];
  }
  addDep(dep) {
    this.deps.push(dep);
  }
  // 通知所有watcher执行更新
  notify() {
    this.deps.forEach(dep => {
      dep.update();
    });
  }
}

// Watcher: 具体的更新执行者
class Watcher {
  constructor() {
    Dep.target = this;
  }
  update() {
    console.log('====================================');
    console.log('from Watcher update: 视图更新啦！！！');
    console.log('====================================');
  }
}
