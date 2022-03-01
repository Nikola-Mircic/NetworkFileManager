const socketIO = require('socket.io');

const fs = require('fs');

const IORouter = require('./routing/IORouter');
const app = require('./routing/PathRouter')(saveFile, saveLogData, __dirname);

const readline = require("readline");

const { networkInterfaces } = require('os');

const server = require('http').createServer(app);
const io = socketIO(server, {});

var PORT = process.env.PORT || 80;
var available_adresses = getLocalAddressList();
var IP = "localhost";

const LogSystem = require("./logsystem.js");
const { wirte_log } = require('./routing/IORouter');
const Log = new LogSystem();
const LOG_PATH = __dirname+"/db/logs/log_history.dat";

const default_ip = findValue("-default-ip");
const default_addr_name = findValue("-default-addr-name");
const default_port = findValue("-default-port");

const save_files = (findValue("-save-files")=="true") ? true:false;
const write_log = (findValue("-write-log")=="true") ? true:false;

if(default_port !== ""){
	PORT = parseInt(default_port);
}

if(default_ip !== ""){
	IP = default_ip;

	server.listen(PORT,IP,()=>{
		console.log("Server started on http://"+IP+":"+PORT);
	});
	IORouter.getRouter({save_files:save_files, write_log:write_log}).listen(io, saveFile, saveLogData);
}else if(default_addr_name !== ""){
	IP = available_adresses[default_addr_name][0];

	server.listen(PORT,IP,()=>{
		console.log("Server started on http://"+IP+":"+PORT);
	});
	IORouter.getRouter({save_files:save_files, write_log:write_log}).listen(io, saveFile, saveLogData);
}else{
	inputUserAddress();
}


function saveFile(fileID, file, sender, transport=false){
	let fileName = file.name;
	let fileData = file.data;

	let filePath = `./db/${(transport)?"transport/":""}`; 

	fs.appendFile(filePath+fileName, fileData,(err)=>{
		if(err)
			console.log("Something went wrong!");
	});
};

function saveLogData(fileID, file, sender){
	let fileName = file.name;

	let time = Log.getTime();
	console.log(`Saved file : ${fileName} [${time}]`);

	Log.writeLog(fileName, "./db/"+fileName, sender, LOG_PATH, fileID, time, (result)=>{
		if(result){
			console.log("Transport logged");
		}else{
			console.log("Transport failed to log");
		}
	});
}

function inputUserAddress(){
	const userInCLI = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	console.log("Available networks:");
	Object.keys(available_adresses).map((resultName)=>{
		console.log(`  - ${resultName}`);
	});

	userInCLI.question("Select one of above networks to run your program on (to run only on your computer type 'localhost' ):", function(name) {
		if(name === 'localhost') return;
	
		let selection = available_adresses[name];
	
		if(selection)
			IP = selection[0];
		else{
			IP = "localhost";
			console.log(`Can't find network with name: ${name}`);
		}
	
		userInCLI.close();
	});
	
	userInCLI.on("close", function() {
		console.log(`Ip address set to ${IP}`);

		server.listen(PORT,IP,()=>{
			console.log("Server started on http://"+IP+":"+PORT);
		});
		IORouter.getRouter({save_files:save_files, write_log:write_log}).listen(io, saveFile, saveLogData);
	});
}

function findValue(label){
	var result = "";

	process.argv.forEach((value, idx)=>{
		if(value.indexOf(label) !== -1){
			result = process.argv[idx+1];
		}
	})
	return result;
}

function getLocalAddressList(){
	const nets = networkInterfaces();
	const results = Object.create(null); 

	for (const name of Object.keys(nets)) {
	    for (const net of nets[name]) {
	        if (net.family === 'IPv4' && !net.internal) {
	            if (!results[name]) {
	                results[name] = [];
	            }
	            results[name].push(net.address);
	        }
	    }
	}

	return results;
}

