var http = require('http');
var ecstatic = require('ecstatic');
var config = require('./config.js');
var stepmotor = require('./stepmotordriver.js');

var app = http.createServer(
  ecstatic({ root: __dirname + '/public' })
);
var io = require('socket.io')(app);
var fs = require('fs');
app.listen(config.tcpport);

console.log(config.getSerialPort());
console.log(config.baudrate);

stepmotor.initialize({
	serialport: config.getSerialPort(), 
	baudrate: config.baudrate});

// set StepMotor initilization callback function
var cbInit = function () {
	console.log("----------------------------------------")
	console.log("            Board Initialized           ");
	console.log("----------------------------------------\n")

  // set StepMotor Speed and Acceleration
  //stepmotor.setSpeedAcceleration(6000,2000);
};
stepmotor.setCbAfterOpen(cbInit);

io.on('connection', function (socket) {

  if(stepmotor.isInitialized() === true) {

  	var cbfunc = function (curpospercent) {
      console.log("StepMotor Current Position: ", curpospercent);
      socket.emit('windowpos', { wid: 'a1', value: curpospercent });  	
	};

  	stepmotor.getCurrentPositionPercent(cbfunc);
  }

  socket.on('windowctrl', function (data) {
    console.log(data);
    stepmotor.moveToPositionPercent(data.value);
    socket.broadcast.emit('windowpos', { wid: 'a1', value: data.value });
  });  
});

console.log('Listening on :%d', config.tcpport);
