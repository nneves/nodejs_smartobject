module.exports = {
	_uart_list: ["/dev/ttyUSB0", "/dev/ttyACM0", "/dev/cu.usbmodem421", "/dev/cu.usbmodem621", "/dev/ttyO4", "/dev/null"],
	_uart_sel: 4,
	getSerialPort: 
		function () { 
				return this._uart_list[this._uart_sel];
		},
	baudrate: "57600",
	tcpport: 9000
};
