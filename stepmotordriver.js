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

var cbGetCurrentPositionPercent = [];

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
    	//spFlagInit = true; // note: flag will be set in response to board initialization: see callback regexpr
        console.log("[stepmotordriver.js]:Serial Port %s Connected at %d bps!", config.serialport, config.baudrate);

        /*
        // note: flag will be set in response to board initialization: see callback regexpr
        if (spCBAfterOpen !== undefined) {
        	console.log("[stepmotordriver.js]:Launching SerialPort After Open callback...");
        	spCBAfterOpen();
        }
        else {
        	console.log("[stepmotordriver.js]:No SerialPort After Open callback defined!");
        }
        */

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

	// map async callback responses:
	// tested with: https://www.debuggex.com/

	// initialization message: <id=a1:ok;
	var pattern = /(<id=[a-zA-z][0-9]:ok;)/;
	if (pattern.test(idata)) {
		
		if(spCBAfterOpen != undefined && spFlagInit == false)
			spCBAfterOpen();

		spFlagInit = true;
	}	

	// getcurrpos: "<id=a1:reqpos=0:ok;"
	var pattern = /(<id=[a-zA-z][0-9]:reqpos=[0-9]*:ok;)/;
	if (pattern.test(idata)) {
		// found temperature response, split data into format:
		var tempdata = idata.split(pattern);
		var res1 = tempdata[1].split(':');
		var res2 = res1[1].split('=');
		var result = res2[1];
		console.log("--> getcurrpos=%s", result);

		// verify is callback requires response
		if(cbGetCurrentPositionPercent.length > 0) {

			// requires callback to be defined
			var tempValue = parseInt(result, 10);
			var ncurpos = tempValue*100/maxPosition;
			console.log("---> cbGetCurrentPositionPercent(%d);\n", ncurpos);

			cbGetCurrentPositionPercent[0](ncurpos);
			cbGetCurrentPositionPercent.splice(0,1);
		}
	}
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

function getcurrpospercent (callback) {

	// add callback to array
	//console.log("Add object to cbGetCurrentPositionPercent");
	//console.log(callback.toString());
	cbGetCurrentPositionPercent.push(callback);

	spWrite("id="+hwid+":getcurrpos:_;");
	// async response: reqpos
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