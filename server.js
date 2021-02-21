const express = require('express');
const socketIO = require('socket.io');

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
const IP = process.env.OPENSHIFT_NODEJS_IP || process.env.IP;

const LogSystem = require("./logsystem.js");
const Log = new LogSystem();
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
})

app.get('/example/b', function (req, res, next) {
  console.log('the response will be sent by the next function ...')
  next()
}, function (req, res) {
  res.send('Hello from B!')
})

app.post('/', function(req, res){
	if(Array.isArray(req.files.file)){
		var upload = req.files.file;
		upload.forEach((file,idx)=>{
			console.log(`Started saving file #${(idx+1)}...`);
			saveFile(file, req, res);
		});
	}else{
		saveFile(req.files.file, req, res);
	}
	
    res.redirect('/');
});

function saveFile(file, req, res){
	let fileName = file.name;
	let fileData = file.data;

	fs.writeFile("./db/"+fileName,fileData,(err)=>{
		if(err){
			res.write("alert('Something went wrong!')");
		}else{
			console.log("File saved at : "+__dirname + "/db/"+fileName);
		}
	});

	let time = Log.getTime();
	console.log(`Saved file : ${fileName} [${time}]`);

	Log.writeLog(fileName, "./db/"+fileName, requestIp.getClientIp(req), LOG_PATH, time, (result)=>{
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
	console.log('User connected');

	(function(){
		console.log("Sending data to new user");
		regUser.forEach((item, index)=>{
			socket.emit('newUser', item);
		});
	})();

	socket.on('register',(data)=>{
		var user = {
			'name': data.name,
			'id': socket.id
		};

		regUser[regUser.length] = user;
		socket.broadcast.emit('newUser', user);
	})

	socket.on('data', (data)=>{
		console.log(`[Server] Received data for : ${data.toName} [Sender: ${socket.id}]`);

		//TRANSPORTING FILES...

		io.to(data.to).emit('data',{
			'from' : socket.id,
			'data' : data.data
		});
	})

	socket.on('disconnect', ()=>{
		regUser = regUser.filter((value, idx, arr)=>{
			return value.id != socket.id;
		});
		io.emit('removeUser', {
			'id': socket.id
		});
	});
});
