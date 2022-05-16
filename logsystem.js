const { json } = require("express/lib/response");

class LogSystem{
	costructor(){
		this.dateCreated = this.getTime();
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

	async writeLog(fileName, filePath, clientIP_send, clientIP_receive, path, id, time, cb){
		let fs = require("fs");
		console.log("Writing logs [#"+id+"] for: \n \t"+
						"- Clent 1 : " + clientIP_send + "\n\t" +
						"- Clent 2 : " + clientIP_receive + "\n\t" +
						"- File : " + fileName + "\n\t" +
						"- In : " + filePath + "\n\t" +
						"- Time : " + time );

		let logData = {
			id: id,
			from: clientIP_send,
			to: clientIP_receive,
			path: filePath,
			filename: fileName,
			time: time,
		}
		
		const chunks = [];
		for await (let chunk of fs.createReadStream(path)) {
			chunks.push(chunk);
		}
		
		let logs = chunks.map((item)=> new TextDecoder().decode(item)).toString();

		logs = logs.substring(0, logs.length-3);

		logData = Buffer.from(logs+JSON.stringify(logData)+",0]}");

		fs.writeFile(path,logData,(err)=>{
			if(cb){
				if(err) cb(false)
				else cb(true);
			}
			return;
		});
	}
}

module.exports = LogSystem;