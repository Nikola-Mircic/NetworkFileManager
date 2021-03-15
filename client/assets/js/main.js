const socket = io();

var activeUsers = [];
var receivedFiles = {};
var selectedFiles = [];

var struct = { 
    name: "", 
    type: "", 
    size: 0, 
    data: null, 
    chunks: 0, 
};
const chunkSize = 400000;

socket.on('newUser',function(data){
	$("users").show();
	activeUsers[activeUsers.length] = data;
	showUsers();
});

socket.on('removeUser', function(data){
	activeUsers = activeUsers.filter(function(val, idx, arr){
		return val.id != data.id;
	});

	showUsers();
});

socket.on('data',function(data){
	if(!receivedFiles[data.file.name]){
		receivedFiles[data.file.name] = Object.assign({}, struct, data.file);
	}else{
		var concat = new Uint8Array(receivedFiles[data.file.name].data.byteLength + data.file.data.byteLength);
		concat.set(new Uint8Array(receivedFiles[data.file.name].data));
		concat.set(new Uint8Array(data.file.data), receivedFiles[data.file.name].data.byteLength);

		receivedFiles[data.file.name].data = concat;
	}
	
	receivedFiles[data.file.name].chunks++;

	if(receivedFiles[data.file.name].chunks * chunkSize >= data.file.size){
		var blob = new Blob([receivedFiles[data.file.name].data],
							 {type: data.file.type});

		let url = window.URL.createObjectURL(blob);

		var a = `<li><a href="${url}" download="${data.file.name}">${data.file.name}</a></li><br>`;

		$("#received").show();
		$("#data ol").append(a);

		console.log(`Received file: `);
		console.log(receivedFiles[data.file.name]);
	}

	socket.emit('request data',{
		from: data.from,
		receiver: socket.id,
	})
});


socket.on('request data',function(data){
	var fileToSent = null;
	for(let i in selectedFiles){
		if((selectedFiles[i].chunks == 0) || 
		   (selectedFiles[i].chunks*chunkSize < selectedFiles[i].size)){
			fileToSent = selectedFiles[i];
			selectedFiles[i].chunks++;
			break;
		}
	}

	if(fileToSent == null){
		socket.emit("transfer end",data);
		return;
	}

	var chunkEnd = Math.min(fileToSent.size, (fileToSent.chunks)*chunkSize);

	var chunk = fileToSent.data.slice((fileToSent.chunks-1)*chunkSize, chunkEnd);

	socket.emit('data',{
		from: socket.id,
		receiver: data.receiver,
		receiverName: data.receiverName,
		file: {
			name: fileToSent.name,
			type: fileToSent.type,
			size: fileToSent.size,
			data: chunk
		}
	});
});

async function sendToUser(name, id){
	var files = $('#file').get(0).files;

	console.log(files);

	for(let i=0;i<files.length;++i){
		console.log("Processing "+i+"...");
		let temp = Object.assign({},struct);
		temp.name = files[i].name;
		temp.type = files[i].type;
		temp.size = files[i].size;

		temp.data = new Uint8Array(await files[i].arrayBuffer());
		selectedFiles.push(temp);
	}

	selectedFiles.forEach(function(item, idx){
		console.log(item);
	});

	var chunk = -1;
	if(selectedFiles[0].size < chunkSize){
		chunk = selectedFiles[0].data;
	}else{
		chunk = selectedFiles[0].data.slice(0,chunkSize);
	}

	selectedFiles[0].chunks++;

	socket.emit('data',{
		from: socket.id,
		receiver: id,
		receiverName: name,
		file: {
			name: selectedFiles[0].name,
			type: selectedFiles[0].type,
			size: selectedFiles[0].size,
			data: chunk
		}
	});
};

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
    /*receivedFiles.forEach(function(file, idx){
    	zip.file(file.name, file.data);
    });*/
	
	zip.generateAsync({type:"blob"})
		.then(function(content) {
		    saveAs(content, "download.zip");
		});
});

function registerUser(){
	let name = $("#register input").val();
	socket.emit('register',{
		'name': name
	});
};

function showUsers(){
	if(activeUsers.length > 0){
		$("#users").show();
	}else{
		$("#users").hide();
	}

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

var filesListDiv = $("#selectedFiles");
$('#file').on('input', function (e) {
   	var files = e.target.files;
   	let list = $("#showFilesList");

   	if(files === null){
   		console.log('input was null...');
   		return;
   	}

   	filesListDiv.show();

   	var data = "";
   	console.log("Loading files...");
   	for (var i = 0; i < files.length; ++i) {
		var name = files.item(i).name;
   		data += `<li>${name}</li>\n`;
	}
   	list.html(data);
});

$("#submit").on('click', function(e){
	if(activeUsers.length > 0){
		e.preventDefault();
	}
});

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