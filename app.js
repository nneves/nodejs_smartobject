var config = require('./config.js');
var stepmotor = require('./stepmotordriver.js');

console.log(config.getSerialPort());
console.log(config.baudrate);

stepmotor.initialize({
	serialport: config.getSerialPort(), 
	baudrate: config.baudrate});

setTimeout( function () {
	stepmotor.setDirection(stepmotor.directionClockWise);
}, 1*5000);

setTimeout( function () {
	stepmotor.setSpeedAcceleration(6000, 3000);
}, 2*5000);

setTimeout( function () {
	stepmotor.moveToPosition(1000);
}, 3*5000);

setTimeout( function () {
	stepmotor.moveToPositionFeedback(20000, 1000);
}, 4*5000);

setTimeout( function () {
	stepmotor.moveToPositionFeedback(0, 1000);
}, 7*5000);