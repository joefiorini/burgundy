function loadConsumerTokens(){
  var obj;
  if(process.env.consumer_key){
    obj = process.env
  } else {
    obj = require("./creds");
  }
  return obj;
}

var http = require('http'),
    Twitter = require('ntwitter'),
    creds = loadConsumerTokens(),
    consumer_key = creds.consumer_key;
    consumer_secret = creds.consumer_secret;

twitter = new Twitter({
  consumer_key: creds.consumer_key,
  consumer_secret: creds.consumer_secret
});

var express = require("express"),
    app = express.createServer(),
    io = require('socket.io').listen(app);

app.configure(function(){
  app.use(express.static(__dirname + "/public"));
  app.set("views", __dirname + "/views");
  app.set("view engine", "jade");
});

app.get("/", function(req, res){
  var cookie;
  if(cookie = twitter.cookie(req)){
    twitter = new Twitter({
      consumer_key: creds.consumer_key,
      consumer_secret: creds.consumer_secret,
      access_token_key: cookie.access_token_key,
      access_token_secret: cookie.access_token_secret
    });
    twitter.getDirectMessages({ count: 20 }, function(error, data){
      if(error){ console.log("ERROR!", error); }
      res.render('index', {layout: false, messages: data});
    });
  } else {
    res.send("<a href='/sign-in' class='twitter'>Sign in with Twitter</a>");
  }
});

app.get("/sign-in", function(req, res){
  console.log("Twitter request");
  login = twitter.login("/sign-in");
  login(req, res, function(arg){
    console.log("next", arg);
  });
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Listening on port 3000");
});

io.sockets.on('connection', function(socket) {
    console.log((new Date()) + ' Connection accepted.');
    twitter.stream("user", {with:"user"}, function(stream){
      stream.on("error", function(error){
        console.log("Error", error);
        socket.emit("twitter.error", { msg: 'error', data: error });
      });
      stream.on("data", function(data){
        if(data.direct_message !== undefined){
          var res = http.ServerResponse.prototype
          res.app = app;
          res.partial("message", {message: data.direct_message}, function(error, tmpl){
            socket.emit("twitter.direct_message", { message: tmpl });
          });
        }
      });
    });
    socket.on('disconnection', function() {
        console.log((new Date()) + ' user disconnected');
    });
});
