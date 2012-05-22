function loadConsumerTokens(){
  var obj;
  if(process.env.consumer_key){
    obj = process.env
  } else {
    obj = require("./creds");
  }
  return obj;
}

var webSocketServer = require('websocket').server,
    http = require('http'),
    Twitter = require('ntwitter'),
    creds = loadConsumerTokens(),
    consumer_key = creds.consumer_key;
    consumer_secret = creds.consumer_secret;
twitter = new Twitter({
  consumer_key: creds.consumer_key,
  consumer_secret: creds.consumer_secret
});

var express = require("express"),
    app = express.createServer();

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

wsServer = new webSocketServer({
    httpServer: app,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('burgundy-client', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    twitter.stream("user", {with:"user"}, function(stream){
      stream.on("error", function(error){
        console.log("Error", error);
        connection.sendUTF(JSON.stringify({ msg: 'error', data: error }));
      });
      stream.on("data", function(data){
        if(data.direct_message !== undefined){
          var res = http.ServerResponse.prototype
          res.app = app;
          res.partial("message", {message: data.direct_message}, function(error, tmpl){
            connection.sendUTF(JSON.stringify({ msg: 'refreshMessages', data: tmpl }));
          });
        }
      });
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
