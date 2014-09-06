var http = require('http');
var ecstatic = require('ecstatic');
var config = require('./config.js');
var stepmotor = require('./stepmotordriver.js');

var app = http.createServer(
  ecstatic({ root: __dirname + '/public' })
);
var io = require('socket.io')(app);
var fs = require('fs');
app.listen(8080);

console.log(config.getSerialPort());
console.log(config.baudrate);

stepmotor.initialize({
	serialport: config.getSerialPort(), 
	baudrate: config.baudrate});


io.on('connection', function (socket) {
  /* 
  // socket.io demo
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
  */

  if(stepmotor.isInitialized() === true) {
  	var curpos = stepmotor.getCurrentPositionPercent();
  	console.log("StepMotor Current Position: ", curpos);
    socket.emit('windowpos', { wid: 'a1', value: curpos });  	
  }

  socket.on('windowctrl', function (data) {
    console.log(data);
    stepmotor.moveToPositionPercent(data.value);
  });  
});

console.log('Listening on :8080');