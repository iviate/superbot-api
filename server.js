var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function (socket){
   console.log('connection');

  socket.on('CH01', function (msg) {
    console.log('saying ', msg);
  });

});

http.listen(80, function () {
  console.log('listening on *:80');
});