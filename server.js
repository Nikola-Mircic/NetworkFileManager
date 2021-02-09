const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express()
const server = require('http').createServer(app); 

//start app 
const PORT = process.env.PORT || 80;
const ip = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '192.168.1.9';

app.use(fileUpload({
    createParentPath: true
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname,'client')));

app.get("/",(req, res)=>{
	res.sendFile("/index.html");
});

app.post('/', (req, res) => {
	let fileName = req.files.file.name;
	let fileData = req.files.file.data;
	fs.writeFile("./db/"+fileName,fileData,(err)=>{
		if(err){
			res.write("alert('Something went wrong!')");
		}else{
			console.log("File saved at : "+__dirname + "/db/"+fileName);
		}
	});
	console.log("Received : " + fileName);
    console.log(fileData.toString());
    res.redirect('/');
});

server.listen(PORT,ip,()=>{
	console.log("Server started on "+ip+":"+PORT);
})
