var IORouter = function(){
    this.save_files =  true;
    this.wirte_log = false;
    
    this.getRouter = (setup)=>{
        var newRouter = new IORouter();
        newRouter.save_files = setup.save_files;
        newRouter.write_log = setup.write_log;
        return newRouter;
    };

    this.listen = function(io, saveFile, saveLogData){
        var startTime = 0;
        var regUser = [];

        const LogSystem = require("../logsystem.js");
        const Log = new LogSystem();
        const LOG_PATH = __dirname+"/db/logs/log_history.dat";

        io.on('connection', (socket)=>{
            var user = {
                'id': socket.id,
                'address': socket.client.conn.remoteAddress
            };

            regUser[regUser.length] = user;

            regUser.forEach((item, index)=>{
                if(item.name)
                    socket.emit('newUser', item);
            });
        
            socket.on('register',(data)=>{
                var user = regUser.find((user)=>{
                    return user.id === socket.id;
                });

                user.name = data.name;
        
                socket.broadcast.emit('newUser', user);
            });
        
            socket.on("start-transfer",(data)=>{
                var date = new Date();
                startTime = date.getTime();
                io.to(data.receiver).emit("start-transfer",data);
            })
        
            socket.on('request data', (data) => { 
                socket.to(data.from).emit('request data',data);
            });
        
            socket.on('data', (data)=>{
                if(this.save_files){
                    saveFile(`${data.from}-${data.receiver}`,
                        data.file,
                        data.from,
                        transport=true);
                }
                if(data.file.finished && this.write_log){
                    var sender = regUser.find((user)=>{
                        return user.id === data.from;
                    }).address;
    
                    var receiver = regUser.find((user)=>{
                        return user.id === data.receiver;
                    }).address;

                    saveLogData(`${sender}-${receiver}`,
                            data.file,
                            sender);
                }
                io.to(data.receiver).emit('data',data);
            });
        
            socket.on("transfer end",(data)=>{
                var date = new Date();
                console.log("Transfer ended! Write log: "+this.write_log);

                var sender = regUser.find((user)=>{
                    return user.id === data.from;
                }).address;

                var receiver = regUser.find((user)=>{
                    return user.id === data.receiver;
                }).address;
                
                /*if(this.write_log){
                    saveLogData(`${sender}-${receiver}`,
                            data.file,
                            sender);
                }*/
                
                console.log(`Transfer [${sender} -> ${receiver}] (${Log.getTime()})[~${date.getTime()-startTime} ms] completed!!`);
        
                io.to(data.receiver).emit("transfer end",data);
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
    }
}

module.exports = IORouter;