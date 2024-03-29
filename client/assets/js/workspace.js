'use strict'

var filesListDiv = $("#selectedFiles");

var testDataSize = null;

if(workspaceFiles && ( Object.keys(workspaceFiles.directories).length>0 || workspaceFiles.files.length>0)){
    $("#dropField").hide();
    $("#selection_view").show();
    writeLoadedFiles(workspaceFiles, filesListDiv);
}

fetch(window.location.origin+'/get-user-ip').then((ip)=>{
    if(!ip) return;

    ip.text().then((value)=>{
        $("#ipv4").html(value);
    });
})

$(".headerContainer").on('click', ()=>{
    $("#headerContainer").toggle();
    $("#userIpAddr").toggle();
});

(function(){
    var head = document.getElementsByTagName("head")[0];
    var link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", "./assets/css/index.css");
    link.setAttribute("name", "css");

    document.getElementsByName("css").forEach((node)=>node.remove());

    head.append(link);

    updateUser(window.sessionStorage.getItem("username"));
})();

function toggleEntryList(path){
    var pathSteps = path.split("/");

    var dir = workspaceFiles;

    for(let i=1; i<pathSteps.length; ++i) dir = dir.directories[pathSteps[i]];

    $(`#${pathSteps[pathSteps.length-1]}_data`).toggle();

    dir.isOpen = !dir.isOpen;

    filesListDiv.empty();
    writeLoadedFiles(workspaceFiles, filesListDiv);
}

function showData(path){
    var pathSteps = path.split("/");

    var dir = workspaceFiles;

    for(let i=1; i<pathSteps.length-1; ++i) dir = dir.directories[pathSteps[i]];

    var file = (dir.files.filter((testFile)=>testFile.name() == pathSteps[pathSteps.length-1]))[0];

    if(file.state == EDITING){
        $("#dataView").hide();
        file.state = WAITING;
        return;
    }

    if(file.state != WAITING) return;

    doForEachFile(workspaceFiles, (file)=>{
        if(file.state == EDITING) file.state = WAITING;
    })

    file.state = EDITING;

    $("#dataView").show();

    file.data((data)=>{
        $("#dataView").html(`<div id="fileStats">
                                <h3 id="fileName"></h3>
                                <h3 id="fileSize"></h3>
                            </div>`);
        if(file.type().split("/")[0] == "text"){
            data = String.fromCharCode.apply(null, data);

            var t = $(`<textarea id="file_${file.name()}"></textarea>`);
            t.val(data);

            $("#dataView").append(t);
            $("#dataView #fileName").html(file.name());
            $("#dataView #fileSize").html(`${file.size()/1000} kb`);

            $("textarea").on('change keyup paste', updateTextData);

            document.getElementById("dataView").scrollIntoView();
        }
        if(file.type().split("/")[0] == "image"){
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL(file.original);
            
            $("#dataView").append(`<img style="max-height:500px;margin: 15px auto;display: block;" alt=\"${file.name()}\"src=\"${imageUrl}\">`);
            $("#dataView #fileName").html(`${file.name()}`);
            $("#dataView #fileSize").html(`${file.size()/1000} kb`);
        }
    });
}

//Calls function 'handle' for every file in the 'dir' directory
function doForEachFile(dir, handle){
    dir.files.forEach((file)=>handle(file));

    Object.keys(dir.directories).forEach((key)=>{
        doForEachFile(dir.directories[key], handle);
    });
}

function updateTextData(){
    var text = this.value;
    
    doForEachFile(workspaceFiles, (file)=>{
        if(file.state == EDITING){
            file.original = new File([text], file.name(), {
                    type: file.type(),
                });
        }
    })
}

function loadFileData(entry, directory, writeFunc){
    if(entry.isFile){
        entry.file(async function(sample){
            //testDataSize = sample;
            var temp = {};
            temp.original = sample;
            temp = Object.assign(temp, FileStruct);

            temp.original = sample;
            temp.isFile = true;
            temp.path = directory.path+"/"+entry.name;

            directory.files=[...(directory.files || []),temp];

            writeFunc();
        });
    }else if(entry.isDirectory){
        var temp = Object.assign({}, DirectoryStruct);
        temp.directories = {};
        temp.path = directory.path+"/"+entry.name;

        var reader = entry.createReader();
        reader.readEntries((entries)=>{
            for (var i = 0; i < entries.length; i++) {
                loadFileData(entries[i], temp, writeFunc);
            }
        });

        directory.directories[entry.name] = temp;
        writeFunc();
    }
}

function onFileDrop(event, dir_path){
    event.preventDefault();
    event.stopPropagation();

    $("#dropField").hide();
    $("#selection_view").show();

    var default_folder = workspaceFiles;
    if(dir_path){
        dir_path = dir_path.split("/");
        for(let i=1;i<dir_path.length;++i) default_folder = default_folder.directories[dir_path[i]];
    }

    var items = event.dataTransfer.items; 
    for(let i=0; i<items.length; ++i){
        let item = items[i].webkitGetAsEntry();

        loadFileData(item, default_folder, function(){
            writeLoadedFiles(workspaceFiles, filesListDiv);
        });
    }
}

function onDragOver(event){
    event.preventDefault();

    event.dataTransfer.dropEffect = 'copy'
}

$('#file').on('input',onInput);

async function onInput(e){
    $("#dropField").hide();
    $("#selection_view").show();

    var files = e.target.files;
    for(let i=0;i<files.length;++i){
        filesListDiv.append(`<li onclick=\"showData('/${files[i].name}')\">
                                <div id="fileStats">
                                    <p id="fileName">
                                        <i class="fa-regular fa-file"></i> ${files[i].name}</p>
                                    <div>
                                        <p id="fileSize">
                                            ${files[i].size/1000} kb
                                        </p>
                                        <button onclick="downloadFile('/${files[i].name}', event)">
                                            <i class="fa-solid fa-file-arrow-down"></i>
                                        </button>
                                        <button onclick="deleteFile('/${files[i].name}', event)">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </li>`);

        let temp = Object.assign({}, FileStruct);
        
        temp.original = files[i];
        temp.isFile = true;
        temp.path = "";

        workspaceFiles.files=[...(workspaceFiles.files || []),temp];
    }
}

function deleteFile(path, event){
	event.stopPropagation()
	
	var pathSteps = path.split("/");

	var dir = workspaceFiles;

	for(let i=1;i<pathSteps.length-1;++i) dir = dir.directories[pathSteps[i]];

	dir.files = dir.files.filter((file)=>{
		return file.name() != pathSteps[pathSteps.length-1];
	});

	writeLoadedFiles(workspaceFiles, filesListDiv)
}

async function downloadFile(filePath, e){
    e.stopPropagation();
    e.preventDefault();

    var pathSteps = filePath.split("/");

	var dir = workspaceFiles;

	for(let i=1;i<pathSteps.length-1;++i) dir = dir.directories[pathSteps[i]];

	var file = dir.files.filter((file)=>{
		return file.name() == pathSteps[pathSteps.length-1];
	})[0];

    file.data((data)=>{
        var file_blob = new Blob([data], {type:file.type()})
        saveAs(file_blob, file.name());
    });
};

function deleteFolder(folderPath, event){
    event.stopPropagation()

    var pathSteps = folderPath.split("/");

	var dir = workspaceFiles;

	for(let i=1;i<pathSteps.length-1;++i) dir = dir.directories[pathSteps[i]];

    delete dir.directories[pathSteps[pathSteps.length-1]];

    writeLoadedFiles(workspaceFiles, filesListDiv);
}

async function downloadFolder(folderPath, e){
    e.stopPropagation();
    e.preventDefault();

    var pathSteps = folderPath.split("/");

	var dir = workspaceFiles;

	for(let i=1;i<pathSteps.length;++i) {
        if(pathSteps[i] != "") 
            dir = dir.directories[pathSteps[i]];
    }
    
    var zip = new JSZip();
    console.log("Zipping ");
    console.log(dir);
    var files = extractFiles(dir);
    console.log(files);
    for(var fileIdx in files){
    	let file = files[fileIdx];
        let file_data = await file.data();
    	var blob = new Blob([file_data],
							 {type: file.type()});
    	zip.file(file.path.substring(1), file.name(), blob);
    	console.log(`Zipped : ${file.name()}`);
    }
	
	zip.generateAsync({type:"blob"})
		.then(function(content) {
		    saveAs(content, "download.zip");
		});
};
