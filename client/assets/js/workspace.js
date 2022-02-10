var filesListDiv = $("#selectedFiles");

function writeLoadedFiles(directory, list){
    directory.files.forEach((file)=>{
        list.append(`<li>${file.name}</li>`);
    })

    Object.keys(directory.directories).forEach((key)=>{
        if(directory.directories[key].isOpen){
            list.append(`<li onclick=\"toggleEntryList('${key}')\"><i class=\"fa fa-angle-down\"></i> ${key}:</li>`);

            var dirList = $(`<ul id="${key}_data"></ul>`);
        
            writeLoadedFiles(directory.directories[key], dirList);
            list.append(dirList);
        }else{
            list.append(`<li onclick=\"toggleEntryList('${key}')\"><i class=\"fa fa-angle-right\"></i> ${key}:</li>`);
        }
    });
};

if(workspaceFiles && ( Object.keys(workspaceFiles.directories).length>0 || workspaceFiles.files.length>0)){
    $("#dropField").hide();
    $("#selection_view").show();
    writeLoadedFiles(workspaceFiles, filesListDiv);
}

function toggleEntryList(name){
    $(`#${name}_data`).toggle();

    toggleDirectoryOpenState(workspaceFiles, name);

    filesListDiv.empty();
    writeLoadedFiles(workspaceFiles, filesListDiv);
}

function toggleDirectoryOpenState(directory, name){
    console.log(name, directory);
    Object.keys(directory.directories).forEach((key)=>{
        if(key == name){
            directory.directories[key].isOpen = !directory.directories[key].isOpen;
        }else{
            toggleDirectoryOpenState(directory.directories[key], name);
        }
    });
}

function appendFileEntryToList(list, fileEntry){
    if(fileEntry.isFile){
        console.log("Appending ... "+fileEntry.name);
        list.append(`<li>${fileEntry.name}</li>`);
    }else if(fileEntry.isDirectory){
        list.append(`<li onclick=\"toggleEntryList('${fileEntry.name}')\"><i class=\"fa fa-angle-right\"></i> ${fileEntry.name}:</li>`);
        var dirList = $(`<ul id=\"${fileEntry.name}_data\" class=\"fileItem\"></ul>`);

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

function onFileDrop(event){
    event.preventDefault();

    $("#dropField").hide();
    $("#selection_view").show();

    var items = event.dataTransfer.items; 
    for(let i=0; i<items.length; ++i){
        let item = items[i].webkitGetAsEntry();

        appendFileEntryToList(filesListDiv, item);
        loadFileData(item, workspaceFiles)
            .then((success)=>{
                if(!success) console.log("Error loading item");
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
        filesListDiv.append(`<li>${files[i].name}</li>`);

        let temp = Object.assign({}, FileStruct);
        
        temp.name = files[i].name;
        temp.type = files[i].type;
        temp.size = files[i].size;
        temp.data = new Uint8Array(await files[i].arrayBuffer());
        temp.isFile = true;
        temp.path = "";

        workspaceFiles.files=[...(workspaceFiles.files || []),temp];
    }
}