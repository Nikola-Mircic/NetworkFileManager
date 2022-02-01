var filesListDiv = $("#selectedFiles");

function writeLoadedFiles(directory, list){
    directory.files.forEach((file)=>{
        list.append(`<li>${file.name}</li>`);
    })

    Object.keys(directory.directories).forEach((key)=>{
        var dirList = $("<ul></ul>");
        list.append(`<li>${key}:</li>`);
        writeLoadedFiles(directory.directories[key], dirList);
        list.append(dirList);
    });
};

if(userRootDir && ( Object.keys(userRootDir.directories).length>0 || userRootDir.files.length>0)){
    $("#dropField").hide();
    $("#selection_view").show();
    writeLoadedFiles(userRootDir, filesListDiv);
}

function onFileDrop(event){
    event.preventDefault();

    $("#dropField").hide();
    $("#selection_view").show();

    var items = event.dataTransfer.items; 
    for(let i=0; i<items.length; ++i){
        let item = items[i].webkitGetAsEntry();

        appendFileEntryToList(filesListDiv, item);
        loadFileData(item, userRootDir)
            .then((success)=>{
                if(!success) console.log("Error loading item");
            });
    }
}

function appendFileEntryToList(list, fileEntry){
    if(fileEntry.isFile){
        console.log("Appending ... "+fileEntry.name);
        list.append(`<li>${fileEntry.name}</li>`);
    }else if(fileEntry.isDirectory){
        list.append(`<li>${fileEntry.name}:</li>`);
        var dirList = $("<ul></ul>");

        var reader = fileEntry.createReader();
        reader.readEntries((entries)=>{
            for (var i = 0; i < entries.length; i++) {
                appendFileEntryToList(dirList, entries[i]);
            }
        });

        list.append(dirList);
    }
}

function loadFileData(entry, directory){
    return new Promise((resolve, reject)=>{
        function handleEntry(entry, directory){
            if(entry.isFile){
                entry.file(async function(sample){
                    let temp = Object.assign({}, FileStruct);
        
                    temp.name = sample.name;
                    temp.type = sample.type;
                    temp.size = sample.size;
                    temp.data = new Uint8Array(await sample.arrayBuffer());
                    temp.isFile = true;
                    temp.path = entry.fullPath;
        
                    directory.files=[...(directory.files || []),temp];
                });
            }else if(entry.isDirectory){
                var temp = Object.assign({}, DirectoryStruct);
                temp.directories = {};
                temp.path = entry.fullPath;
        
                var reader = entry.createReader();
                reader.readEntries((entries)=>{
                    for (var i = 0; i < entries.length; i++) {
                        handleEntry(entries[i], temp);
                    }
                });
        
                directory.directories[entry.name] = temp;
            }
        }
        handleEntry(entry, directory);

        resolve(true);
    });
}

function onDragOver(event){
    event.preventDefault();

    event.dataTransfer.dropEffect = 'copy'
}

async function onInput(e){
    $("#dropField").hide();
    $("#selection_view").show();

    var files = e.target.files;
    for(let i=0;i<files.length;++i){
        filesListDiv.append(`<li>${files[i].name}</li>`);

        let temp = Object.assign({}, FileStruct);
        
        temp.name = files[i].name;
        temp.type = files[i].type;
        temp.size = files[i].size;
        temp.data = new Uint8Array(await files[i].arrayBuffer());
        temp.isFile = true;
        temp.path = "";

        userRootDir.files=[...(userRootDir.files || []),temp];
    }
}

$('#file').on('input',onInput);
/*let list = $("#showFilesList");

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
   	list.html(data);*/
