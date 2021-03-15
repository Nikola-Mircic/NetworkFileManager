class LogSystem{
	costructor(){
		console.log("[LogSystem] Created new instance.");
	}

	getTime(){
		this.date = new Date();
		let time = this.date.getDate() + "/" +
					(this.date.getMonth()+1) + "/" +
					this.date.getFullYear() + ", " +
					this.date.getHours() + ":" +
					this.date.getMinutes() + ":" +
					this.date.getSeconds() + ":" +
					this.date.getMilliseconds();

		return time;
	}

	writeLog(fileName, filePath, clientIP, path, id, time, cb){
		let fs = require('fs');
		let logData = `Log [#${id}] from ${clientIP}: [${filePath}] [${fileName}] [${time}] \n`;
		console.log("Writing logs [#"+id+"] for: \n \t"+
						"- Clent : " + clientIP + "\n\t" +
						"- File : " + fileName + "\n\t" +
						"- In : " + filePath + "\n\t" +
						"- Time : " + time );

		fs.appendFile(path,logData,(err)=>{
			if(err){
				if(cb!=null){
					cb(false);
				}
				return;
			}

			if(cb!=null){
				cb(true);
			}
		});
	}
}

module.exports = LogSystem;