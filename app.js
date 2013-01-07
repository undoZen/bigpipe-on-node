var express = require('express')
  , cons = require('consolidate')
  , jade = require('jade')
  , path = require('path')
  , fs = require('fs')

var app = express()

app.engine('jade', cons.jade)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

var temp = {
    s1: jade.compile(fs.readFileSync(path.join(__dirname, 'views', 's1.jade')))
  , s2: jade.compile(fs.readFileSync(path.join(__dirname, 'views', 's2.jade')))
}

var getData = {
    d1: function (fn) {
        setTimeout(fn, 3000, null, { content: "Hello, I'm the first section." })
    }
  , d2: function (fn) {
        setTimeout(fn, 5000, null, { content: "Hello, I'm the second section." })
    }
}

var static = express.static(path.join(__dirname, 'static'))
app.use('/static', function (req, res, next) {
  setTimeout(static, 2000, req, res, next)
})
app.use(function (req, res) {
  res.render('layout', function (err, str) {
    if (err) return res.req.next(err)
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.write(str)
  })
  var n = 2
  getData.d1(function (err, s1data) {
    res.write('<section id="s1">' + temp.s1(s1data) + '</section>')
    --n || res.end()
  })
  getData.d2(function (err, s2data) {
    res.write('<section id="s2">' + temp.s2(s2data) + '</section>')
    --n || res.end()
  })
})

app.listen(3000)
