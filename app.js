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
