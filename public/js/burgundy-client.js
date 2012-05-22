function BurgundyClient(){
}

BurgundyClient.connect = function(){
  new BurgundyClient().connect();
}

BurgundyClient.prototype.connect = function(){
  var url = "http://" + document.URL.substr(7).split('/')[0];

  this.socket = io.connect(url);

  this.socket.on("twitter.direct_message", this.refreshMessages.bind(this))
  this.socket.on("twitter.error", this.handleError.bind(this))
  this.socket.on("disconnect", this.handleWebsocketClose.bind(this));
}

BurgundyClient.prototype.handleWebsocketClose = function() {
    alert("WebSocket Connection Closed.");
};

BurgundyClient.prototype.refreshMessages = function(data) {
  $(".message-list").prepend(data.message);
}

BurgundyClient.prototype.handleError = function(error) {
  $(".error").show();
  var decrementTimer = function(){
    var currentTime = parseInt($(".error .time").text());
    $(".error .time").text(currentTime - 1);
    countdown = setTimeout(decrementTimer, 1000);
  }
  var countdown = setTimeout(decrementTimer, 1000);
  setTimeout(function(){
    clearTimeout(countdown);
    window.location.reload();
  }, 5000);
}
