const express = require('express');

const bodyParser = require('body-parser');
const morgan = require('morgan');
const requestIp = require('request-ip');

const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

const app = express()
const server = require('http').createServer(app);

//start app 
const PORT = process.env.PORT || 80;
const IP = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '192.168.1.9';

const LogSystem = require("./logsystem.js");
const Log = new LogSystem();
const LOG_PATH = __dirname+"/db/logs/log_history.dat";

app.use(fileUpload({
    createParentPath: true
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(requestIp.mw());

app.use(express.static(path.join(__dirname,'client')));

app.get("/",(req, res)=>{
	//var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	console.log("USER CONNECTED!!!");
	res.sendFile("/index.html");
});

app.post('/', (req, res) => {
	var upload = req.files.file;
	upload.forEach((file,idx)=>{
		console.log(`Started saving file #${(idx+1)}...`);
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
		console.log(fileData.toString());
		Log.writeLog(fileName, "./db/"+fileName, requestIp.getClientIp(req), LOG_PATH, time, (result)=>{
			if(result){
				console.log("Transport logged");
			}else{
				console.log("Transport failed to log");
			}
		});
	});

    res.redirect('/');
});

function getTime(){
		var date = new Date();
		let time = date.getDate() + "/" +
					(date.getMonth()+1) + "/" +
					date.getFullYear() + ", " +
					date.getHours() + ":" +
					date.getMinutes() + ":" +
					date.getSeconds();

		return time;
	};

server.listen(PORT,IP,()=>{
	console.log("Server started on http://"+IP+":"+PORT);
})
