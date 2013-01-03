#用 node.js 实现 BigPipe

BigPipe 是 Facebook 开发的优化网页加载速度的技术。网上几乎没有用 node.js 实现的文章，实际上，不止于 node.js，BigPipe 用其他语言的实现在网上都很少见。以至于这技术出现很久以后，我还以为就是整个网页的框架先发送完毕后，用另一个或几个 ajax 请求再请求页面内的模块。直到不久前，我才了解到原来 BigPipe 的核心概念就是只用一个 HTTP 请求，只是页面元素不按顺序发送而已。

了解了这个核心概念就好办了，得益于 node.js 的异步特性，很容易就可以用 node.js 实现 BigPipe。本文会一步一步详尽地用例子来说明 BigPipe 技术的起因和一个基于 node.js 的简单实现。

我会用 express 来演示，简单起见，我们选用 jade 作为模版引擎，并且我们不使用引擎的子模版（partial）特性，而是子模版渲染完成以后的 HTML 作为父模版的数据。

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
