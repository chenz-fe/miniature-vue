// 扫描模板中所有依赖（指令、插值、绑定、事件等）创建更新函数和watcher
class Compile {
  // el是宿主元素或其选择器
  // vm当前Vue实例
  constructor(el, vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;
    if (this.$el) {
      // 将dom节点转换为Fragment提高执行效率
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译，编译完成以后所有的依赖已经替换成真正的值
      this.compile(this.$fragment);
      // 将生成的结果追加至宿主元素
      this.$el.appendChild(this.$fragment);
    }
  }
  node2Fragment(el) {
    // 创建一个新的Fragment
    const fragment = document.createDocumentFragment();
    let child;
    // 将原生节点移动至fragment
    while ((child = el.firstChild)) {
      // appendChild 是移动操作，移动一个节点，child 就会少一个，最终结束循环
      fragment.appendChild(child);
    }
    return fragment;
  }
  // 编译指定片段
  compile(el) {
    let childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      // 判断node类型，做相应处理
      if (this.isElementNode(node)) {
        // 元素节点要识别v-xx或@xx
        this.compileElement(node);
      } else if (
        this.isTextNode(node) &&
        /\{\{(.*)\}\}/.test(node.textContent)
      ) {
        // 文本节点，只关心{{msg}}格式
        this.compileText(node, RegExp.$1); // RegExp.$1匹配{{}}之中的内容
      }
      // 遍历可能存在的子节点
      if (node.childNodes && node.childNodes.length) {
        this.compile(node);
      }
    });
  }

  compileElement(node) {
    // console.log('编译元素节点');
    // <div v-text="test" @click="onClick"></div>
    const attrs = node.attributes;
    Array.from(attrs).forEach(attr => {
      const attrName = attr.name; // 获取属性名 v-text
      const exp = attr.value; // 获取属性值 test
      if (this.isDirective(attrName)) {
        // 指令
        const dir = attrName.substr(2); // text
        this[dir] && this[dir](node, this.$vm, exp);
      } else if (this.isEventDirective(attrName)) {
        // 事件
        const dir = attrName.substr(1); // click
        this.eventHandler(node, this.$vm, exp, dir);
      }
    });
  }

  compileText(node, exp) {
    // console.log('编译文本节点');
    this.text(node, this.$vm, exp);
  }

  isElementNode(node) {
    return node.nodeType == 1; //元素节点
  }

  isTextNode(node) {
    return node.nodeType == 3; //元素节点
  }

  isDirective(attr) {
    return attr.indexOf('v-') == 0;
  }

  isEventDirective(dir) {
    return dir.indexOf('@') == 0;
  }

  // 文本更新
  text(node, vm, exp) {
    this.update(node, vm, exp, 'text');
  }

  // 处理html
  html(node, vm, exp) {
    this.update(node, vm, exp, 'html');
  }

  // 双向绑定
  model(node, vm, exp) {
    this.update(node, vm, exp, 'model');

    let val = vm.exp;
    // 双绑还要处理视图对模型的更新
    node.addEventListener('input', e => {
      vm[exp] = e.target.value; // 这里相当于执行了 set
    });
  }

  // 更新
  // 能够触发这个 update 方法的时机有两个：1-编译器初始化视图时触发；2-Watcher更新视图时触发
  update(node, vm, exp, dir) {
    let updaterFn = this[dir + 'Updater'];
    updaterFn && updaterFn(node, vm[exp]); // 立即执行更新；这里的 vm[exp] 相当于执行了 get
    new Watcher(vm, exp, function (value) {
      // 每次创建 Watcher 实例，都会传入一个回调函数，使函数和 Watcher 实例之间形成一对一的挂钩关系
      // 将来数据发生变化时， Watcher 就能知道它更新的时候要执行哪个函数
      updaterFn && updaterFn(node, value);
    });
  }

  textUpdater(node, value) {
    node.textContent = value;
  }

  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  modelUpdater(node, value) {
    node.value = value;
  }

  eventHandler(node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm), false);
    }
  }
}
