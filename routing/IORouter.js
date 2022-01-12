const IORouter = function(io, saveFile, saveLogData){
    var startTime = 0;
    var regUser = [];
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
    
        socket.on("start-transfer",(data)=>{
            var date = new Date();
            startTime = date.getTime();
            io.to(data.receiver).emit("start-transfer",data);
        })
    
        socket.on('request data', (data) => { 
            socket.to(data.from).emit('request data',data);
        });
    
        socket.on('data', (data)=>{
            saveFile(`${data.from}-${data.receiver}`,
                     data.file,
                     data.from,
                     transport=true);
            io.to(data.receiver).emit('data',data);
        });
    
        socket.on("transfer end",(data)=>{
            var date = new Date();
            saveLogData(`${data.from}-${data.receiver}`,
                        data.file,
                        data.from);
    
            console.log(`Transfer [${data.from} -> ${data.receiver}] (${Log.getTime()})[~${date.getTime()-startTime} ms] completed!!`);
    
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

module.exports = IORouter;