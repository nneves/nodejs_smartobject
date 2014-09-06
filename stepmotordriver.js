// Module Objectives:
// - initialize serial port to communicate with an Arduino StepMotor Driver

var config = {serialport: "/dev/ttyUSB0", baudrate: 115200};
var	iserialport = require("serialport");
var	iSerialPort = iserialport.SerialPort; // Serial Port - Localize object constructor
var	spCBAfterOpen = undefined;
var	sp = undefined;
var	spFlagInit = false;
var	emulatedStepMotorResponseTime = 50;
var flagLowLvlDebug = true;

var hwid = "a1";
var maxPosition = 50000; // max number of steps required to open window

//------------------------------------------------------------------
// public functions
//------------------------------------------------------------------
function spSetConfig (iconfig) {

	console.log('[stepmotordriver.js]:Serial Port Set Config: ', JSON.stringify(iconfig));

	// verify and updates config
	verifyUpdateConfig(iconfig);
};

function initialize (iconfig) {

	console.log('[stepmotordriver.js]:initialize: ',JSON.stringify(iconfig));

	// verify if object was already initialized
	if (sp !== undefined)
		return sp;

	// verify and updates config
	if (typeof iconfig === 'object')
		verifyUpdateConfig(iconfig);

	// SerialPort object initializationconsole
	console.log('[stepmotordriver.js]:Instantiate Serial Port object');
	sp = new iSerialPort(config.serialport, {
	    baudrate: config.baudrate,
	    parser: iserialport.parsers.readline("\n")
	});

	// Register Serial Port RX callback
	sp.on("data", spCBResponse);

	// register serial port on.open callback
	sp.on('open', function(err) {
    if ( !err )
    	spFlagInit = true;
        console.log("[stepmotordriver.js]:Serial Port %s Connected at %d bps!", config.serialport, config.baudrate);

        if (spCBAfterOpen !== undefined) {
        	console.log("[stepmotordriver.js]:Launching SerialPort After Open callback...");
        	spCBAfterOpen();
        }
        else {
        	console.log("[stepmotordriver.js]:No SerialPort After Open callback defined!");
        }

        // calling StepMotor emulator initializaion messages when using /dev/null
        emulateStepMotorInitMsg();
	});
};

function spInitialized () {
	return spFlagInit;
};

//------------------------------------------------------------------
// getters/setters functions
//------------------------------------------------------------------
function spSetCbAfterOpen (cbfunc) {
	spCBAfterOpen = cbfunc;
};

//------------------------------------------------------------------
// private functions
//------------------------------------------------------------------
function verifyUpdateConfig (iconfig) {

	console.log("[stepmotordriver.js]:verifyUpdateConfig();");
	if (typeof iconfig === 'object' && iconfig.serialport !== undefined && iconfig.serialport !== undefined) {
		
		console.log('[stepmotordriver.js]:Config SerialPort: '+iconfig.serialport);
		config.serialport = iconfig.serialport;
	}
	if (typeof iconfig === 'object' && iconfig.baudrate  !== undefined && iconfig.baudrate !== undefined) {
		
		console.log('[stepmotordriver.js]:Config BaudRate: '+iconfig.baudrate);	
		config.baudrate = iconfig.baudrate;
	}
	console.log('[stepmotordriver.js]:Serial Port initialization: %s, %d ...', config.serialport, config.baudrate);
};

function spWrite (cmd) {
	
	if (cmd === undefined || cmd.length == 0) {
		spCBResponse("empty_cmd\n");
		return false;
	}
	
	// verifiy if cmd last char equals to ';'
	var endchar = '';
	if (cmd.charAt(cmd.length-1) != ';')
		endchar = ';';
	
	if (flagLowLvlDebug == true) {
		console.log("[stepmotordriver.js]:spWrite: %s", cmd.trim()+endchar); 
	}

	// writes data to serialport
	sp.write(cmd.trim()+endchar);

	// normal conditions: serialport (StepMotorDriver) will responde 'ok' and sp.on("data"...) is triggered
	// special condition: /dev/null needs to emulate serialport callback (using setTimeout for additional delay)
	if (config.serialport.toUpperCase() === '/DEV/NULL') {

		setTimeout(function () {
			if (flagLowLvlDebug == true)
				console.log('[stepmotordriver.js]: SerialPort simulated callback response (/dev/null): ok;\r\n');
			spCBResponse("ok;\n");

		}, emulatedStepMotorResponseTime );
	}

	return true;
};

function spCBResponse (data) {

	// remove \r or \n from response data (safeguard)
	var idata = data.replace(/\r/g, "");
		idata = idata.replace(/\n/g, "");

	console.log("[stepmotordriver.js]:RECEIVED_DATA: %s\r\n", idata);

/*
		// NOTE: 
		// printer temperature data will be triggered in the 'ok' switch
		// {"response":"ok T:18.8 /0.0 B:0.0 /0.0 @:0"}
		// need to implement a special case with regex to test this 
		// specific response and warp it in a {"temperture":idata}; 
		var pattern = /([a-zA-z@]:)/;
		if (pattern.test(idata)) {
			// found temperature response, split data into format:
			// ["ok ", "T:", "131.3 /0.0 ", "B:", "0.0 /0.0 ", "@:", "0"]
			var tempdata = idata.split(pattern);
			var temperature = {
					"T0": tempdata[2].split("/")[0].replace(" ", ""),
					"T1": tempdata[2].split("/")[1].replace(" ", ""),
					"B0": tempdata[4].split("/")[0].replace(" ", ""),
					"B1": tempdata[4].split("/")[1].replace(" ", ""),
					"C": tempdata[6].replace(" ", "")
				};
			var rescmd2 = {"temperature":temperature};
			oStream.emit('data', JSON.stringify(rescmd2)+'\r\n\r\n');			

*/

};

function emulateStepMotorInitMsg () {

	//emulater StepMotor initial messages when unsing /dev/null
	if (config.serialport.toUpperCase() === '/DEV/NULL') {

		setTimeout(function () {
			if (flagLowLvlDebug == true) {
				console.log('[stepmotordriver.js]:emulateStepMotorInitMsg\r\n');
				spCBResponse("<id=a1:ok;\r\n");
			}

		}, emulatedStepMotorResponseTime );
	}
};

//------------------------------------------------------------------
// public functions - Step Motor Driver specific
//------------------------------------------------------------------
// id=a1:setdir:1;
// id=a1:setdir:-1;
function setdir (idir) {
	spWrite("id="+hwid+":setdir:"+idir.toString()+";");
};

// id=a1:setspeedacl:6000:3000;
function setspeedacl (ispeed, iacceleration) {
	spWrite("id="+hwid+":setspeedacl:"+ispeed.toString()+":"+iacceleration+";");
};

// id=a1:moveto:15000;
// id=a1:moveto:500000;
function moveto (destpos) {
	spWrite("id="+hwid+":moveto:"+destpos.toString()+";");
};

function movetofeedback (destpos, feedback) {
	spWrite("id="+hwid+":movetofeedback:"+destpos.toString()+":"+feedback.toString()+";");
};

function getcurrpospercent () {
	spWrite("id="+hwid+":getcurrpos:_;");
	// requires callback to be defined
	var tempValue = 50000;
	var ncurpos = tempValue*100/maxPosition;

	return ncurpos;
};

// id=a1:movetopercent:100;
// id=a1:movetopercent:0;
function movetopercent (destpospercent) {
	var absolutepos = destpospercent*maxPosition/100;
	console.log("MoveToPercent(%d) -> MoveToPosition(%d)", destpospercent, absolutepos);
	spWrite("id="+hwid+":moveto:"+absolutepos.toString()+";");
};

//------------------------------------------------------------------
// export
//------------------------------------------------------------------
module.exports = {
	initialize: initialize,
	isInitialized: spInitialized,
	setConfig: spSetConfig,
	setCbAfterOpen: spSetCbAfterOpen,
	setDirection: setdir,
	directionClockWise: 1,
	directionCounterClockWise: -1,	
	setSpeedAcceleration: setspeedacl,
	moveToPosition: moveto,
	moveToPositionFeedback: movetofeedback,
	moveToPositionPercent: movetopercent,
	getCurrentPositionPercent: getcurrpospercent
};
//------------------------------------------------------------------