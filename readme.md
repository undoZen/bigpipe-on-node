#用 node.js 实现 BigPipe

BigPipe 是 Facebook 开发的优化网页加载速度的技术。网上几乎没有用 node.js 实现的文章，实际上，不止于 node.js，BigPipe 用其他语言的实现在网上都很少见。以至于这技术出现很久以后，我还以为就是整个网页的框架先发送完毕后，用另一个或几个 ajax 请求再请求页面内的模块。直到不久前，我才了解到原来 BigPipe 的核心概念就是只用一个 HTTP 请求，只是页面元素不按顺序发送而已。

了解了这个核心概念就好办了，得益于 node.js 的异步特性，很容易就可以用 node.js 实现 BigPipe。本文会一步一步详尽地用例子来说明 BigPipe 技术的起因和一个基于 node.js 的简单实现。

我会用 express 来演示，简单起见，我们选用 jade 作为模版引擎，并且我们不使用引擎的子模版（partial）特性，而是以子模版渲染完成以后的 HTML 作为父模版的数据。

先建一个 nodejs-bigpipe 的文件夹，写一个 package.json 文件如下：

    {
        "name": "bigpipe-experiment"
      , "version": "0.1.0"
      , "private": true
      , "dependencies": {
            "express": "3.x.x"
          , "consolidate": "latest"
          , "jade": "latest"
        }
    }

运行 npm install 安装这三个库，consolidate 是用来方便调用 jade 的。

先做个最简单的尝试，两个文件：

app.js:

    var express = require('express')
      , cons = require('consolidate')
      , jade = require('jade')
      , path = require('path')

    var app = express()

    app.engine('jade', cons.jade)
    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'jade')

    app.use(function (req, res) {
      res.render('layout', {
          s1: "Hello, I'm the first section."
        , s2: "Hello, I'm the second section."
      })
    })

    app.listen(3000)

views/layout.jade

    doctype html

    head
      title Hello, World!
      style
        section {
          margin: 20px auto;
          border: 1px dotted gray;
          width: 80%;
          height: 150px;
        }

    section#s1!=s1
    section#s2!=s2

效果如下：

![screenshot 1](https://gist.github.com/raw/c5383ff669fdbdef7e0d/6817128ff3fac863d455032f4bb2b163d9a722b3/screenshot/1.png)

接下来我们把两个 section 模版放到两个不同的模版文件里：

views/s1.jade:

    h1 Partial 1
    .content!=content

views/s2.jade:

    h1 Partial 2
    .content!=content

在 layout.jade 的 style 里增加一些样式

    section h1 {
      font-size: 1.5;
      padding: 10px 20px;
      margin: 0;
      border-bottom: 1px dotted gray;
    }
    section div {
      margin: 10px;
    }

将 app.js 的 app.use() 部分更改为：

    var temp = {
        s1: jade.compile(fs.readFileSync(path.join(__dirname, 'views', 's1.jade')))
      , s2: jade.compile(fs.readFileSync(path.join(__dirname, 'views', 's2.jade')))
    }
    app.use(function (req, res) {
      res.render('layout', {
          s1: temp.s1({ content: "Hello, I'm the first section." })
        , s2: temp.s2({ content: "Hello, I'm the second section." })
      })
    })

之前我们说“以子模版渲染完成以后的 HTML 作为父模版的数据”，指的就是这样，`temp.s1` 和 `temp.s2` 两个方法会生成 s1.jade 和 s2.jade 两个文件的 HTML 代码，然后把这两段代码作为 layout.jade 里面 s1、s2 两个变量的值。

现在页面看起来是这样子：
![screenshot 2](https://gist.github.com/raw/c5383ff669fdbdef7e0d/9f386f6c5982240e720885e8b363d99f10c0fd06/screenshot/2.png)

一般来说，两个 section 的数据是分别获取的——不管是通过查询数据库还是 RESTful 请求，我们用两个函数来模拟这样的异步操作。

    var getData = {
        d1: function (fn) {
            setTimeout(fn, 3000, null, { content: "Hello, I'm the first section." })
        }
      , d2: function (fn) {
            setTimeout(fn, 5000, null, { content: "Hello, I'm the second section." })
        }
    }

这样一来，app.use() 里的逻辑就会比较复杂了，最简单的处理方式是：

    app.use(function (req, res) {
      getData.d1(function (err, s1data) {
        getData.d2(function (err, s2data) {
          res.render('layout', {
              s1: temp.s1(s1data)
            , s2: temp.s2(s2data)
          })
        })
      })
    })

这样也可以得到我们想要的结果，但是这样的话，要足足 8 秒才会返回。

![8s](https://gist.github.com/raw/c5383ff669fdbdef7e0d/f303873e7caecb711a39391c9337095ee2e0c1a7/screenshot/4.png)

其实实现逻辑可以看出 getData.d2 是在 getData.d1 的结果返回后才开始调用，而它们两者并没有这样的依赖关系。我们可以用如 async 之类的处理 JavaScript 异步调用的库来解决这样的问题，不过我们这里就简单手写吧：

    app.use(function (req, res) {
      var n = 2
        , result = {}
      getData.d1(function (err, s1data) {
        result.s1data = s1data
        --n || writeResult()
      })
      getData.d2(function (err, s2data) {
        result.s2data = s2data
        --n || writeResult()
      })
      function writeResult() {
        res.render('layout', {
            s1: temp.s1(result.s1data)
          , s2: temp.s2(result.s2data)
        })
      }
    })

这样就只需 5 秒。

![5s](https://gist.github.com/raw/c5383ff669fdbdef7e0d/98d2b87107354f5d2e837b0c618387b5257934e9/screenshot/3.png)

在接下来的优化之前，我们加入 jquery 库并把 css 样式放到外部文件，顺便，把之后我们会用到的浏览器端使用 jade 模板所需要的 runtime.js 文件也加入进来，在包含 app.js 的目录下运行：

    mkdir static
    cd static
    curl http://code.jquery.com/jquery-1.8.3.min.js -o jquery.js
    ln -s ../node_modules/jade/runtime.min.js jade.js

并且把 layout.jade 中的 style 标签里的代码拿出来放到 static/style.css 里，然后把 head 标签改为：

    head
      title Hello, World!
      link(href="/static/style.css", rel="stylesheet")
      script(src="/static/jquery.js")
      script(src="/static/jade.js")

在 app.js 里，我们把它们两者的下载速度都模拟为两秒，在`app.use(function (req, res) {`之前加入：

    var static = express.static(path.join(__dirname, 'static'))
    app.use('/static', function (req, res, next) {
      setTimeout(static, 2000, req, res, next)
    })

受外部静态文件的影响，我们的页面现在的加载时间为 7 秒左右。

![7s](https://gist.github.com/raw/c5383ff669fdbdef7e0d/bb38a3a421259f9120d893ac9cc9458947af0f0b/screenshot/6.png)
