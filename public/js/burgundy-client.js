function BurgundyClient(){
  this.messageHandlers = {
    refreshMessages: this.refreshMessages.bind(this),
    error: this.handleError.bind(this)
  }
}

BurgundyClient.connect = function(){
  new BurgundyClient().connect();
}

BurgundyClient.prototype.connect = function(){
  var url = "ws://" + document.URL.substr(7).split('/')[0];

  var wsCtor = window['MozWebSocket'] ? MozWebSocket : WebSocket;
  this.socket = new wsCtor(url, 'burgundy-client');

  this.socket.onmessage = this.handleWebsocketMessage.bind(this);
  this.socket.onclose = this.handleWebsocketClose.bind(this);
}

BurgundyClient.prototype.handleWebsocketMessage = function(message) {
    try {
        var command = JSON.parse(message.data);
    }
    catch(e) { /* do nothing */ }

    if (command) {
        this.dispatchCommand(command);
    }
};

BurgundyClient.prototype.handleWebsocketClose = function() {
    alert("WebSocket Connection Closed.");
};

BurgundyClient.prototype.dispatchCommand = function(command) {
    // Do we have a handler function for this command?
    var handler = this.messageHandlers[command.msg];
    if (typeof(handler) === 'function') {
        // If so, call it and pass the parameter data
        handler.call(this, command.data);
    }
};

BurgundyClient.prototype.refreshMessages = function(data) {
  $(".message-list").prepend(data);
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
