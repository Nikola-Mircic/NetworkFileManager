const express = require('express');
const socketIO = require('socket.io');
const SocketIOFileUpload = require("socketio-file-upload");

const bodyParser = require('body-parser');
const morgan = require('morgan');
const requestIp = require('request-ip');

const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

const app = express()
const server = require('http').createServer(app);
const io = socketIO(server, {});

const PORT = process.env.PORT || 80;
const IP = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "localhost";

const LogSystem = require("./logsystem.js");
const Log = new LogSystem();
console.log(LogSystem);
const LOG_PATH = __dirname+"/db/logs/log_history.dat";

var regUser = [];

app.use(fileUpload({
    createParentPath: true
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(requestIp.mw());

app.use('/assets',express.static(path.join(__dirname,'/client/assets')));

app.get('/', function(req, res, next){
	console.log(`Sending response to the user [${requestIp.getClientIp(req)}]...`);
	res.sendFile(__dirname+'/client/index.html');
});

app.post('/', function(req, res){
	if(Array.isArray(req.files.file)){
		var upload = req.files.file;
		upload.forEach((file,idx)=>{
			console.log(`Started saving file #${(idx+1)}...`);
			saveFile(idx, file, requestIp.getClientIp(req));
		});
	}else{
		saveFile(0, req.files.file, requestIp.getClientIp(req));
	}
	
    res.redirect('/');
});

function saveFile(fileID, file, sender, transport){
	let fileName = file.name;
	let fileData = file.data;

	let filePath = `./db/${(transport)?"transport/":""}`; 

	fs.writeFile(filePath+fileName,fileData,(err)=>{
		if(err){
			console.log("Something went wrong!");
		}else{
			console.log("File saved at : "+path.join(__dirname,filePath+fileName));
		}
	});

	let time = Log.getTime();
	console.log(`Saved file : ${fileName} [${time}]`);

	Log.writeLog(fileName, "./db/"+fileName, sender, LOG_PATH, fileID, time, (result)=>{
		if(result){
			console.log("Transport logged");
		}else{
			console.log("Transport failed to log");
		}
	});
};

server.listen(PORT,IP,()=>{
	console.log("Server started on http://"+IP+":"+PORT);
});

io.on('connection', (socket)=>{
	console.log("Sending data to new user");
	regUser.forEach((item, index)=>{
		socket.emit('newUser', item);
	});

	socket.on('register',(data)=>{
		var user = {
			'name': data.name,
			'id': socket.id
		};

		regUser[regUser.length] = user;
		socket.broadcast.emit('newUser', user);
	});

	socket.on('request data', (data) => { 
		socket.to(data.from).emit('request data',data);
	});

	socket.on('data', (data)=>{
		io.to(data.receiver).emit('data',data);
	});

	socket.on("transfer end",(data)=>{
		console.log(`Transfer [${data.from} -> ${data.receiver}] (${Log.getTime()}) completed!!`);
	});

	socket.on('disconnect', ()=>{
		regUser = regUser.filter((value, idx, arr)=>{
			return value.id != socket.id;
		});
		io.emit('removeUser', {
			'id': socket.id
		});
	});
});
