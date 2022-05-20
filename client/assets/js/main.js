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

const chunkSize = 40000;

function redirect(path){
	fetch(window.location.origin+path).then((data)=>{
		data.text().then((page)=>{
					$("body").html(getBody(page));
				});
	});
}

function getBody(page){
	return page.substring(page.indexOf("<body>"),page.indexOf("</body>"));
}

window.onload = ()=>{
	var username = window.sessionStorage.getItem('username');
	if(username && username !== 'null'){
		if(socket.disconnected)
			socket.connect();

		socket.emit('register',{
			'name':username
		});
	}
};

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
							<p id="fileName">
								<i class="fa-regular fa-file"></i> ${file.name()}
							</p>
							<p id="fileSize">
								${file.size()/1000} kb
							</p>
							<div class="buttonSet" id="btn_set_${filePath}">
								<button onclick="downloadFile('${filePath}', event)">
									<i class="fa-solid fa-file-arrow-down"></i>
								</button>
								<button onclick="deleteFile('${filePath}', event)">
									<i class="fa-solid fa-trash"></i>
								</button>
							</div>
						</div>
                    </li>`);
        
        if(file.state == EDITING){
            showData(filePath);
        }
    })

    Object.keys(directory.directories).forEach((key)=>{
        if(directory.directories[key].isOpen){
            list.append(`<li class="folderStats" ondrop="onFileDrop(event, '${directory.directories[key].path}');" ondragover="onDragOver(event, '${directory.directories[key].path}');" onclick=\"toggleEntryList('${directory.directories[key].path}')\">
							<p><i class="fa-solid fa-folder"></i> ${key}:</p>
							<div class="buttonSet">
								<button onclick="downloadFolder('${directory.directories[key].path}', event)">
									<i class="fa-solid fa-file-arrow-down"></i>
								</button>
								<button onclick="deleteFolder('${directory.directories[key].path}', event)">
									<i class="fa-solid fa-trash"></i>
								</button>
							</div>
                         </li>`);

            var dirList = $(`<ul id="${key}_data"></ul>`);

            writeLoadedFiles(directory.directories[key], dirList);
            list.append(dirList);
        }else{
            list.append(`<li class="folderStats" ondrop="onFileDrop(event, '${directory.directories[key].path}');" ondragover="onDragOver(event, '${directory.directories[key].path}');" onclick=\"toggleEntryList('${directory.directories[key].path}')\">
							<p><i class="fa-solid fa-folder"></i> ${key}:</p>
							<div class="buttonSet">
								<button onclick="downloadFolder('${directory.directories[key].path}', event)">
									<i class="fa-solid fa-file-arrow-down"></i>
								</button>
								<button onclick="deleteFolder('${directory.directories[key].path}', event)">
									<i class="fa-solid fa-trash"></i>
								</button>
							</div>
                         </li>`);
        }
    });
};

socket.on('newUser',function(data){
	if(activeUsers.map((user)=>user.id).indexOf(data.id) === -1)
		activeUsers[activeUsers.length] = data;

	if(typeof(onUsersUpdate) !== 'undefined')
		onUsersUpdate();
});

socket.on('removeUser', function(data){
	activeUsers = activeUsers.filter(function(val, idx, arr){
		return val.id != data.id;
	});

	if(typeof(onUsersUpdate) !== 'undefined')
		onUsersUpdate();
});

socket.on("start-transfer",function(data){
	receivedSize = 0;
	packageSize = data.info.size;

	data.info.files.forEach((file)=>{
		receivedFiles[""+file.name] = {
			data: new Uint8Array(),
			type: "",
			fileSize: file.fileSize
		}
	});

	showProgressBar();
})

socket.on('data',function(data){
	var fileName = data.file.name;
	
	receivedSize += data.file.data.byteLength;

	updateReceivingBar();

	if(receivedFiles[fileName]){
		var concat = new Uint8Array(receivedFiles[fileName].data.byteLength + data.file.data.byteLength);
		concat.set(new Uint8Array(receivedFiles[fileName].data));
		concat.set(new Uint8Array(data.file.data), receivedFiles[fileName].data.byteLength);

		receivedFiles[fileName].data = concat;

		if(receivedFiles[fileName].data.byteLength == receivedFiles[fileName].fileSize){
			var newOriginal = new File([receivedFiles[fileName].data], fileName, {type:data.file.type});
			var newFile = Object.assign({}, FileStruct);
			newFile.original = newOriginal
			newFile.path = data.file.path;

			insertFile(newFile);
		}

		writeLoadedFiles(workspaceFiles, filesListDiv);
	}else{
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
	var pathPassed = "/";

    var dir = workspaceFiles;

    for(let i=1; i<pathSteps.length-1; ++i){
		pathPassed += pathSteps[i];
		if(!dir.directories[pathSteps[i]]){
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
		alert("Data is sent!");
		setTimeout(function(){
			removeProgressBar();
		}, 1000);
		return;
	}

	var chunkEnd = Math.min(fileToSent.size(), (fileToSent.chunks)*chunkSize);

	var chunk = await fileToSent.dataPart((fileToSent.chunks-1)*chunkSize, chunkEnd);

	sentSize += chunk.byteLength;
	let percent = Math.round((sentSize*100)/packageSize);

	$(".progress-done").css("width", percent+'%');
	$(".progress-done").css("opacity", "1");
	$(".progress-done").html(percent+'%'); 

	var fileData = {
			name: fileToSent.name(),
			type: fileToSent.type(),
			size: fileToSent.size(),
			path: fileToSent.path,
			data: chunk
		}

	if(chunkEnd === fileToSent.size()){
		fileData.finished = true;
	}

	socket.emit('data',{
		from: socket.id,
		receiver: data.receiver,
		receiverName: data.receiverName,
		file: fileData
	});

	updateSendingBar();
});

socket.on("transfer end",function(data){
	receivedFiles = {};
	setTimeout(function(){
		removeProgressBar();
	}, 1000);
	if(workspaceFiles && ( Object.keys(workspaceFiles.directories).length>0 || workspaceFiles.files.length>0)){
		if(!$("#dropField") || !$("#selection_view")){
			return;
		}

		$("#dropField").hide();
		$("#selection_view").show();
		writeLoadedFiles(workspaceFiles, filesListDiv);
	}
});

async function sendToUser(name, id){
	var files = extractFiles(workspaceFiles);
	
	for(let i=0;i<files.length;++i){
		selectedFiles.push(files[i]);
	}

	sentSize = 0;
	packageSize = 0;
	selectedFiles.forEach(function(item, idx){
		packageSize += item.size();
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

	showProgressBar();

	var chunk = -1;
	if(selectedFiles[0].size() < chunkSize){
		chunk = await selectedFiles[0].data();	
	}else{
		chunk = await selectedFiles[0].dataPart(0,chunkSize);
	}

	selectedFiles[0].chunks++;

	var fileData = {
			name: selectedFiles[0].name(),
			type: selectedFiles[0].type(),
			size: selectedFiles[0].size(),
			path: selectedFiles[0].path,
			data: chunk
		};

	if(selectedFiles[0].size() < chunkSize){
		fileData.finished = true;	
	}

	socket.emit('data',{
		from: socket.id,
		receiver: id,
		receiverName: name,
		file: fileData
	});

	sentSize += chunk.byteLength;

	updateSendingBar();
};

function extractFiles(dir){
	var dirFiles = new Array();

	dirFiles = dirFiles.concat(dir.files);

	Object.keys(dir.directories).forEach(function(key){

		dirFiles = dirFiles.concat(extractFiles(dir.directories[key]));
	});

	return dirFiles;
}

$("#register").on('submit', (e)=>{
	setTimeout(()=>{}, 1000);
    e.preventDefault();
});

function registerUser(){
	setTimeout(()=>{}, 1000);
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

	window.sessionStorage.clear();

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
		$("#profileName").html(`${username}`);
	window.sessionStorage.setItem("username", username);
}

updateUser(window.sessionStorage.getItem("username"));

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

function showProgressBar(){
	$("#no-transfer").hide();
	$("#progress").show();
	$("#status").show();
}

function updateSendingBar(){
	if($("#progress").css('display') != 'block') return;

	$("#progress-line").width( $("#progress").width() * (sentSize/packageSize) );
	$("#status").html(`${sentSize}/${packageSize}`);
}

async function updateReceivingBar(){
	if($("#progress").css('display') != 'block') return;

	$("#progress-line").width( $("#progress").width() * (receivedSize/packageSize) );
	$("#status").html(`${receivedSize}/${packageSize}`);
}

function removeProgressBar(){
	$("#no-transfer").css("display", "block");

	$("#progress-line").width(0);
	$("#progress").css("display", "none");

	$("#status").html("");
	$("#status").css("display", "none");
}

function addFileToList(file){
	var htmlData = $("#data ol").html();

	let blob = new Blob([file.data], {type: file.type});
	let url = window.URL.createObjectURL(blob);

	htmlData += `<li><a href="${url}" download="${file.name}">${file.name}</a></li><br>`;

	$("#received").show();
	$("#data ol").html(htmlData); 
}



