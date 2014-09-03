module.exports = {
	_uart_list: ["/dev/ttyUSB0", "/dev/ttyACM0", "/dev/cu.usbmodem421", "/dev/cu.usbmodem621"],
	_uart_sel: 3,
	getSerialPort: 
		function () { 
				return this._uart_list[this._uart_sel];
		},
	baudrate: "115200"
};
