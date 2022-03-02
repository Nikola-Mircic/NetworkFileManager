const express = require('express');

const bodyParser = require('body-parser');
const morgan = require('morgan');
const requestIp = require('request-ip');

const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

const PathRouter = function(saveFile, saveLogData, rootPath){
    this.app = express();

    app.use(fileUpload({
        createParentPath: true
    }));
    
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(morgan('dev'));
    app.use(requestIp.mw());
    
    app.use('/assets',express.static(path.join(rootPath, '/client/assets')));

    app.get('/', function(req, res, next){
        console.log(`Sending response to the user [${requestIp.getClientIp(req)}]...`);
        res.sendFile(rootPath+'/client/index.html');
    });

    app.get('/received', function(req, res, next){
        console.log(`Sending response to the user [${requestIp.getClientIp(req)}]...`);
        res.sendFile(rootPath+'/client/received.html');
    });

    app.get('/sent', function(req, res, next){
        console.log(`Sending response to the user [${requestIp.getClientIp(req)}]...`);
        res.sendFile(rootPath+'/client/sent.html');
    });

    this.app.get('/get-user-ip', function(req, res){
        res.send(requestIp.getClientIp(req));
    });
    
    app.post('/', function(req, res){
        if(Array.isArray(req.files.file)){
            var upload = req.files.file;
            upload.forEach((file,idx)=>{
                console.log(`Started saving file #${(idx+1)}...`);
                saveFile(idx, file, requestIp.getClientIp(req));
                saveLogData(idx, file, requestIp.getClientIp(req));
            });
        }else{
            saveFile(0, req.files.file, requestIp.getClientIp(req));
            saveLogData(0, req.files.file, requestIp.getClientIp(req));
        }
        
        res.redirect('/');
    });

    return this.app;
}

module.exports = PathRouter;