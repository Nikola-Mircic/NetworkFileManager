'use strict'

var activeUsers = [];
var receivedFiles = {};
var selectedFiles = [];

var sentSize = 0;
var receivedSize = 0;
var packageSize = 0;

//Posible states of a file
const WAITING = 0;
const SENDING = 1;
const SENT = 2;
const RECEIVING = 3;
const RECEIVED = 4;
const EDITING = 5;

var FileStruct = { 
	original: null, // File variable containing unprocessed data
    chunks: 0, //Chunks of data sent/received
	state: WAITING, //Current state of a file. WAITING means that file is loaded and not sent yet
	path: "", // Path to the file

	name:function(){
			if(this.original) return this.original.name;
			return undefined;
		},
	type:function(){
			if(this.original) return this.original.type;
			return "";
		},
	size:function(){
			if(this.original) return this.original.size;
			return 0;
		},
	//Data from file as a function for better preformance
	data: async function(cb){
			var t = null;
			if(this.original){
				var buffer = await this.original.arrayBuffer();
				t = new Uint8Array(buffer);
			}
			if(cb)
				cb(t);
			else
				return t;
		}, 
	dataPart: async function(begin, end){
		var t = null;
		if(this.original){
			var buffer = await this.original.arrayBuffer();
			t = new Uint8Array(buffer.slice(begin, end));
		}
		return t;
	},
};

// Template for storing files and directories
const DirectoryStruct = {
    directories:{}, //List of directories in a parent directory
    files:[], // List of files in a directory
	path: "",
	isOpen: false,
};

var workspaceFiles =  Object.assign({}, DirectoryStruct); // Directory where users files and directories are stored during editing
var sentFiles =  Object.assign({}, DirectoryStruct); // Directory where sent files and directories are stored
var receivedFiles =  Object.assign({}, DirectoryStruct); // Directory where received files and directories are stored

window.sessionStorage.setItem("files", JSON.stringify(workspaceFiles));

const chunkSize = 400000;

function redirect(path){
	console.log(window.location);
	fetch(window.location.origin+path).then((data)=>{
		data.text().then((page)=>{
					console.log(path);
					$("#pageScript").remove();
					$("head").append(getPageSpecificScripts(page));
					$("body").html(getBody(page));
				});
	});
}

function getPageSpecificScripts(page){
	const commnet = "<!-- PAGE SPECIFIC SCRIPTS-->";
	const commentIndex = page.indexOf(commnet)+commnet.length;
	return page.substring(commentIndex, page.indexOf("</body>"));
}

function getBody(page){
	return page.substring(page.indexOf("<body>"),page.indexOf("</body>"));
}

function writeLoadedFiles(directory, list){
    list.empty();
	if(Object.keys(directory.directories)>0 || directory.files.length>0){
		$("#dropField").hide();
    	$("#selection_view").show();
	}
    directory.files.forEach((file)=>{
        let filePath = (file.path=="")?("/"+file.name()):file.path;
        list.append(`<li onclick=\"showData('${filePath}')\">
                        <div id="fileStats">
                            <p id="fileName"> <i class="fa-regular fa-file"></i> ${file.name()}</p>
                            <p id="fileSize">${file.size()/1000} kb</p>
                        </div>
                    </li>`);
        
        if(file.state == EDITING){
            showData(filePath);
        }
    })

    Object.keys(directory.directories).forEach((key)=>{
        if(directory.directories[key].isOpen){
            list.append(`<li onclick=\"toggleEntryList('${directory.directories[key].path}')\">
							<i class="fa-regular fa-folder-open"></i> ${key}:
                         </li>`);

            var dirList = $(`<ul id="${key}_data"></ul>`);

            writeLoadedFiles(directory.directories[key], dirList);
            list.append(dirList);
        }else{
            list.append(`<li onclick=\"toggleEntryList('${directory.directories[key].path}')\">
							<i class="fa-solid fa-folder"></i> ${key}:
                         </li>`);
        }
    });
};

socket.on('newUser',function(data){
	$("users").show();
	console.log(activeUsers);
	if(activeUsers.map((user)=>user.id).indexOf(data.id) === -1)
		activeUsers[activeUsers.length] = data;
	console.log(activeUsers);
	showUsers();
});

socket.on('removeUser', function(data){
	activeUsers = activeUsers.filter(function(val, idx, arr){
		return val.id != data.id;
	});

	showUsers();
});

socket.on("start-transfer",function(data){
	$(".progress").show();
	receivedSize = 0;
	console.log(data);
	packageSize = data.info.size;

	data.info.files.forEach((file)=>{
		receivedFiles[file.name] = {
			data: new Uint8Array(),
			type: "",
			fileSize: file.fileSize
		}
	})
})

socket.on('data',async function(data){
	console.log(data);
	var fileName = data.file.name;
	if(receivedFiles[fileName]){
		var concat = new Uint8Array(receivedFiles[fileName].data.byteLength + data.file.data.byteLength);
		concat.set(new Uint8Array(receivedFiles[fileName].data));
		concat.set(new Uint8Array(data.file.data), receivedFiles[fileName].data.byteLength);

		receivedFiles[fileName].data = concat;

		if(receivedFiles[fileName].data.byteLength == receivedFiles[fileName].fileSize){
			console.log(`Making new ${fileName} file...`);
			var newOriginal = new File([receivedFiles[fileName].data], fileName, {type:data.file.type});
			var newFile = Object.assign({}, FileStruct);
			newFile.original = newOriginal
			newFile.path = data.file.path;

			insertFile(newFile);

			console.log(newFile);
		}

		writeLoadedFiles(workspaceFiles, filesListDiv);
	}else{
		console.log(`Unexpected file found ${fileName} [${data.file.size} b]`);
		receivedFiles[fileName] = Object.assign({}, data.file);
	}

	socket.emit('request data',{
		from: data.from,
		receiver: socket.id,
		file: data.file
	})
});

function insertFile(file){
	var pathSteps = file.path.split("/");
	console.log(pathSteps);
	var pathPassed = "/";

    var dir = workspaceFiles;

    for(let i=1; i<pathSteps.length-1; ++i){
		pathPassed += pathSteps[i];
		if(!dir.directories[pathSteps[i]]){
			console.log(`Folder ${pathSteps[i]} doesn't exists`);
			var newDir = Object.assign({}, DirectoryStruct);
			newDir.directories = {};
			newDir.path = pathPassed;

			dir.directories[pathSteps[i]] = newDir;
		}
		pathPassed+="/";
		dir = dir.directories[pathSteps[i]];
	}

	dir.files = [...(dir.files || []), file];
}

socket.on('request data',async function(data){
	var fileToSent = null;
	for(let i=0; i<selectedFiles.length; ++i){
		if((selectedFiles[i].chunks == 0) || 
		   (selectedFiles[i].chunks*chunkSize < selectedFiles[i].size())){
			fileToSent = selectedFiles[i];
			selectedFiles[i].chunks++;
			break;
		}
	}

	if(fileToSent == null){
		socket.emit("transfer end",data);
		setTimeout(function() {$(".progress").hide();}, 1000);
		return;
	}

	var chunkEnd = Math.min(fileToSent.size(), (fileToSent.chunks)*chunkSize);

	var chunk = await fileToSent.dataPart((fileToSent.chunks-1)*chunkSize, chunkEnd);

	sentSize += chunk.byteLength;
	let percent = Math.round((sentSize*100)/packageSize);

	$(".progress-done").css("width", percent+'%');
	$(".progress-done").css("opacity", "1");
	$(".progress-done").html(percent+'%'); 

	socket.emit('data',{
		from: socket.id,
		receiver: data.receiver,
		receiverName: data.receiverName,
		file: {
			name: fileToSent.name(),
			type: fileToSent.type(),
			size: fileToSent.size(),
			path: fileToSent.path,
			data: chunk
		}
	});
});

socket.on("transfer end",function(data){
	setTimeout(function() {$(".progress").hide();}, 1000);
});

async function sendToUser(name, id){
	var files = extractFiles(workspaceFiles);
	console.log(files);
	
	for(let i=0;i<files.length;++i){
		console.log("Processing "+i+"...");
		selectedFiles.push(files[i]);
	}

	sentSize = 0;
	packageSize = 0;
	selectedFiles.forEach(function(item, idx){
		packageSize += item.size();
		console.log(item);
	});

	socket.emit("start-transfer",{
		from: socket.id,
		receiver: id,
		receiverName: name,
		info:{
			size: packageSize,
			files: selectedFiles.map((file)=>{
									return {name: file.name(),
											fileSize: file.size()
											}
								})
		}
	});

	var chunk = -1;
	if(selectedFiles[0].size() < chunkSize){
		chunk = await selectedFiles[0].data();
	}else{
		chunk = await selectedFiles[0].dataPart(0,chunkSize);
	}

	selectedFiles[0].chunks++;

	socket.emit('data',{
		from: socket.id,
		receiver: id,
		receiverName: name,
		file: {
			name: selectedFiles[0].name(),
			type: selectedFiles[0].type(),
			size: selectedFiles[0].size(),
			path: selectedFiles[0].path,
			data: chunk
		}
	});

	sentSize += chunk.byteLength;
	let percent = Math.round((sentSize*100)/packageSize);

	$(".progress").show();
	$(".progress-done").css("width", percent+'%');
	$(".progress-done").css("opacity", "1");
	$(".progress-done").html(percent+'%'); 
};

function extractFiles(dir){
	var dirFiles = new Array();

	dirFiles = dirFiles.concat(dir.files);

	Object.keys(dir.directories).forEach(function(key){

		dirFiles = dirFiles.concat(extractFiles(dir.directories[key]));
	});

	return dirFiles;
}

$("#received button").on('click', function(e){
    e.preventDefault();

    if(received.length == 0)
    	return;

    if(received.length == 1)
    	saveAs(received[0].data,received[0].name);

    var zip = new JSZip();

    for(var fileName of Object.keys(receivedFiles)){
    	let file = receivedFiles[fileName];
    	var blob = new Blob([file.data],
							 {type: file.type});
    	zip.file(file.name, blob);
    	console.log(`Zipped : ${file.name}`);
    }
	
	zip.generateAsync({type:"blob"})
		.then(function(content) {
		    saveAs(content, "download.zip");
		});
});

function registerUser(){
	if(socket.disconnected)
		socket.connect();
	let name = $("#register input").val();
	socket.emit('register',{
		'name': name
	});
	$("#register").hide();

	$("#profile").show();
	$("#profile #profileName").text(name);

	updateUser(name);
};

function changeUser(){
	socket.disconnect();

	let name = $("#register input").val();

	$("#register").show();
	$("#register input").val("");

	$("#profile").hide();
};

function updateUser(username){
	if(!window.sessionStorage.getItem("username") || sessionStorage.getItem("username")=='null')
		window.sessionStorage.setItem("username", username);
	else{
		$("#register").hide();
		$("#profile").show();
	}
	if(!username)
		$("#profileName").html("");
	else
		$("#profileName").html(username);
	window.sessionStorage.setItem("username", username);
}

updateUser(window.sessionStorage.getItem("username"));

function showUsers(){
	if(activeUsers.length > 0){
		$("#users").show();
	}else{
		$("#users").hide();
	}

	$("#users").empty();

	if(activeUsers.length > 2){
		$("users").css("height", `${(150+(activeUsers.length-2)*60)}px`);
	}

	var data = "<h3>Send to:</h3>\n";
	activeUsers.forEach(function(val, idx){
		let newButton = `<button class="button" onclick="sendToUser('${val.name}', '${val.id}');">${val.name}</button>\n`;
		data += newButton;
	});

	$("#users").html(data);
}

function extractFileName(fullPath){
	if (fullPath) {
	    var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
	    var filename = fullPath.substring(startIndex);
	    if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
	        filename = filename.substring(1);
	    }
	    return filename;
	}
}

function addFileToList(file){
	var htmlData = $("#data ol").html();
	console.log(`Adding ${file.name} to the page...`);
	console.log(file);

	let blob = new Blob([file.data], {type: file.type});
	let url = window.URL.createObjectURL(blob);

	htmlData += `<li><a href="${url}" download="${file.name}">${file.name}</a></li><br>`;

	$("#received").show();
	$("#data ol").html(htmlData); 
}