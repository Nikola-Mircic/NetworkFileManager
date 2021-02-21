const socket = io();

var activeUsers = [];

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
	console.log(data);
	$("#data").html(data.data); 
});

function registerUser(){
	let name = $("#register input").val();
	socket.emit('register',{
		'name': name
	});
};

function sendToUser(name, id){
	console.log('Sending data to server...');
	socket.emit('data',{
		'to': id,
		'toName': name,
		'data': $("#file").val(),
	});

	console.log($("#file").files);
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
		console.log(name);
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