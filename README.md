## Vue.js 代码实现

检验学习效果的最好方法就是自己造轮子。最近在学习Vue源码，写了一个迷你版vue，实现数据响应式。从step1到step3.2，是开发步骤和实现思路，每一步都可以独立运行。

代码地址：https://github.com/dora-zc/miniature-vue

目录结构

.
├── README.md
├── step0
│   └── defineProperty_test.html
├── step1
│   ├── XVue.js
│   └── index.html
├── step2
│   ├── XVue.js
│   └── index.html
├── step3.1
│   ├── XVue.js
│   ├── compile.js
│   └── index.html
└── step3.2
​    ├── XVue.js
​    ├── compile.js
​    └── index.html

以上每个step文件夹对应下面的每一步骤，代表了代码实现的顺序，每个文件夹下的代码都可以独立运行。

### 1. 步骤一

创建XVue.js。

创建Vue类，通过Observer劫持监听所有属性。

observe函数的作用：递归遍历data选项，它当中的defineReactive函数为data中每一个key定义getter和setter，达到数据劫持的目的。

> 步骤一对应代码目录：step1

### 2. 步骤二

处理页面上的`<div>{{msg}}</div>`，也就是收集依赖，当msg的值发生变化时，视图需要做出相应的变化。因此需要创建依赖管理器，把所有依赖保存起来，当数据发生变化的时候再去更新对应的依赖。

#### 2.1 创建Dep类

Dep负责将视图中的所有依赖收集管理，包括依赖添加和派发通知

1- 在Dep类中创建数组deps=[]，用来存放Watcher的实例

2-创建addDep方法，添加Watcher

3-创建notify方法，通知所有的Wather执行更新。遍历deps数组，调用每个Wather的更新方法

#### 2.2 创建监听器Watcher类

Watcher是具体的更新执行者。

1-将当前Watcher实例添加到Dep.target上。

```js
Dep.target = this
```

之后在get时，就能通过Dep.target拿到当前Watcher的实例。

2-创建update方法

3-set方法中，调用dep.notify，让依赖管理器通知更新，则所有的Watcher会执行update方法

那么问题来了：Watcher在什么时候收集最合适？

在defineReactive函数的get方法中，get方法触发时，把Watcher放进Dep.target中。

那么问题又来了：为什么是在get方法中呢？

因为在扫描视图中的依赖时，如果扫描到`<div>{{msg}}</div>`，此时一定会去访问msg的值，就会触发get。一旦get被触发，就能将Watcher放进dep中，实现依赖收集的目的。所以get是一个合适的时间点。

代码测试：在get中输出dep.deps，如果Watcher已经放进去了，并且控制台打印出Watcher中的update方法中的log，说明这一步操作成功了。

至此，已经完成的工作如下：

![Image text](https://github.com/dora-zc/miniature-vue/blob/master/img/1.png?raw=true)

> 步骤二对应代码目录：step2

现在，Watcher发生变化时，视图还没有更新，下面我们将要完成视图更新的操作。

首先，需要Compile对界面模板解析指令，进行编译，编译的阶段实际是创建Watcher的阶段。Watcher是由编译器创建的。编译器在做依赖收集的时候，顺便把Watcher创建了。Watcher在创建的时候，立刻就能知道它将来要更新的是谁，它应该被谁管理，它发生变化以后值应该是什么。于是Watcher就知道调谁(Updater去做更新了)。

![Image text](https://github.com/dora-zc/miniature-vue/blob/master/img/2.png?raw=true)

### 3.步骤三

创建compile.js,用于扫描模板中所有依赖(指令、插值、绑定、事件…)，创建更新函数和Watcher

#### 3.1 扫描模板

1-创建编译器Compile类，接收两个参数，el(宿主元素或选择器)和vm(当前vue实例)

2-创建node2Fragment函数，将dom节点( $el )截成代码块( 转换为Fragment )来处理，而不是直接做dom操作，提高执行效率

3-创建compile函数，执行编译( 将模板中的动态值替换为真实的值 )，传入代码块

4-将生成的结果追加至宿主元素

##### 3.1.1 node2Fragment函数

创建一个新的fragment，将原生节点移动至fragment

返回fragment，传给编译函数进行编译

##### 3.1.2 compile函数

获取所有的孩子节点，进行遍历，判断节点类型，并作出相应的判断

处理元素节点

处理文本节点( 只处理{{msg}} 这种情况，其他的全部不处理)

...其他的节点类型暂时不判断了

遍历可能存在的子节点，往下递归

下面是compile函数中的两个核心方法

1-compileElement方法：编译元素节点

```html
<div v-text="test" @click="onClick">{{msg}}</div>
```

拿到所有属性名称，进行遍历

2-compileText方法：编译文本节点

代码测试：

在XVue constructor中，创建编译器实例，将宿主元素el和当前vue实例作为参数传入。

如果compileElement和compileText两个函数能触发，控制台打印出"开始编译元素节点"和"开始编译文本节点"，则说明功能正常，可以继续让下走了。

> 对应代码：step3.1



#### 3.2 编译元素节点和文本节点，并创建更新函数

##### 3.2.1 编译元素节点compileElement方法实现

获取节点所有属性，进行遍历。判断指令和事件，已经相应的处理方法。

指令只试着处理v-text，v-html，v-model三个，其他的暂不处理

v-model：双向绑定还需要处理视图对模型的更新

##### 3.2.2 创建更新器函数

更新器函数：接收四个参数，node，vm，exp，dir(指令)

针对指令的更新器主要是在做dom操作

在更新器函数中创建Watcher实例，当Watcher监听到变化的时候，就能触发视图的更新。

至此，全部代码已经完成，双向数据绑定顺利实现！

![Image text](https://github.com/dora-zc/miniature-vue/blob/master/img/4.png?raw=true)

> 对应代码：step3.2



## Vue.js 工作机制

### 初始化

在new Vue()之后，Vue会调用初始化函数，会初始化声明周期、事件、props、methods、data、computed和watcher等。其中最重要的是通过Object.defineProperty设置setter和getter，用来实现响应式和依赖收集。

初始化之后会调用$.mount挂载组件。

### 编译

编译模块分为三个阶段：

#### 1-parse

使用正则解析模板中的vue的指令、变量等等，形成抽象语法树AST

#### 2-optimize

标记一些静态节点，用作后面的性能优化，在diff的时候直接略过

#### 3-generate

把第一步生成的AST转化为渲染函数 render function

### 响应式

这一块是vue最核心的内容。初始化的时候通过defineProperty进行绑定，设置通知的机制，当编译生成的渲染函数被实际渲染的时候，会触发getter进行依赖收集，在数据变化的时候，触发setter进行更新。

### 虚拟dom

虚拟dom是由react首创，Vue2开始支持，就是用JavaScript对象来描述dom结构，数据修改的时候，我们先修改虚拟dom中的数据，然后数组做diff算法，最后再汇总所有的diff，力求做最少的dom操作，毕竟js里对比很快，而真实的dom操作太慢了。

```html
<div name="小菠萝" style="color:red" @click="xx">
   <a>click me</a>
</div>
```

```js
// vdom
{
   tag:'div',
   props:{
      name:'小菠萝',
      style: {color:red},
      onClick:xx
   },
   children:[
      {
        tag:'a',
        text:'click me'
      }
   ]
}
```

### 更新视图

数据修改触发setter，然后监听器会通知进行修改，通过对比两个dom树，得到改变的地方，就是patch，然后只需要把这些差异修改即可。

### 编译

compile的核心逻辑是获取dom，遍历dom，获取{{}}格式的变量，以及每个dom的属性，截取v-和@开头的部分来设置响应式。

![Image text](https://github.com/dora-zc/miniature-vue/blob/master/img/3.png?raw=true)
