function BurgundyClient(){
}

BurgundyClient.connect = function(){
  new BurgundyClient().connect();
}

BurgundyClient.prototype.connect = function(){
  var url = "http://" + document.URL.substr(7).split('/')[0];

  this.socket = io.connect(url);

  this.socket.on("twitter.direct_message", this.refreshMessages.bind(this));
  this.socket.on("twitter.error", this.handleError.bind(this));
  this.socket.on("connect", this.hideError.bind(this));
  this.socket.on("disconnect", this.handleWebsocketClose.bind(this));
}

BurgundyClient.prototype.handleWebsocketClose = function() {
    console.log("WebSocket Connection Closed.");
    $(".disconnected").show();
    retryWithCountdown($(".disconnected"), (function(){
      this.connect();
    }).bind(this));
};

BurgundyClient.prototype.hideError = function() {
  $(".disconnected").hide();
}

BurgundyClient.prototype.refreshMessages = function(data) {
  var firstRow = $(".container .message-group").first(),
      element = $(data.message);
  if(firstRow.children().length == 3){
    element.hide().prependTo('body>.container').wrap('<div class="message-group row-fluid">').show();
  } else {
    firstRow.prepend(data.message);
  }
}

function retryWithCountdown($elm, retryCallback){
  var decrementTimer = function(){
    var currentTime = parseInt($(".time", $elm).text());
    $(".time", $elm).text(currentTime - 1);
    countdown = setTimeout(decrementTimer, 1000);
  }
  var countdown = setTimeout(decrementTimer, 1000);
  setTimeout(function(){
    clearTimeout(countdown);
    retryCallback();
  }, 5000);
}
BurgundyClient.prototype.handleError = function(error) {
  $(".error").show();
  retryWithCountdown($(".error"), function(){
    window.location.reload();
  });
}
