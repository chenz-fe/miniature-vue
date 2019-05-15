// 扫描模板中所有依赖创建更新函数和watcher
class Compile {
  // el是宿主元素或其选择器
  // vm当前Vue实例
  constructor(el, vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;
    if (this.$el) {
      // 将dom节点转换为Fragment提高执行效率
      this.$fragment = this.node2Fragment(this.$el);
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
      fragment.appendChild(child);
    }
    return fragment;
  }
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

  compileElement() {
    console.log('开始编译元素节点');
  }

  compileText(node, exp) {
    console.log('开始编译文本节点');
  }

  isElementNode(node) {
    return node.nodeType == 1; //元素节点
  }

  isTextNode(node) {
    return node.nodeType == 3; //元素节点
  }
}
