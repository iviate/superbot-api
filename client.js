// var io = require('socket.io-client');
// var socket = io.connect('http://localhost:3000', {reconnect: true});

// // Add a connect listener
// socket.on('connect', function (socket) {
//     console.log('Connected!');
// });
// socket.emit('CH01', 'me', 'test msg');

// var io = require('socket.io-client'),
// socket = io.connect('http://localhost', {
//     port: 3000,
//     reconnect: true
// });
// socket.on('connect', function () { console.log("socket connected"); });
// // socket.emit('private message', { user: 'me', msg: 'whazzzup?' });
// socket.emit('CH01', { user: 'me', msg: 'whazzzup?' });

const io = require("socket.io-client");
const socket = io.connect('ws://localhost');

// client-side

socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });

  socket.emit('CH01', "message");
