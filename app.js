var express = require('express')
  , cons = require('consolidate')
  , jade = require('jade')
  , path = require('path')

var app = express()

app.engine('jade', cons.jade)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

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

app.listen(3000)
