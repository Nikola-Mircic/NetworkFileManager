var filesListDiv = $("#selectedFiles");

var testDataSize = null;

function writeLoadedFiles(directory, list){
    directory.files.forEach((file)=>{
        list.append(`<li onclick=\"showData('${file.path}')\">${file.name()}</li>`);
    })

    Object.keys(directory.directories).forEach((key)=>{
        if(directory.directories[key].isOpen){
            list.append(`<li onclick=\"toggleEntryList('${directory.directories[key].path}')\"><i class=\"fa fa-angle-down\"></i> ${key}:</li>`);

            var dirList = $(`<ul id="${key}_data"></ul>`);
        
            writeLoadedFiles(directory.directories[key], dirList);
            list.append(dirList);
        }else{
            list.append(`<li onclick=\"toggleEntryList('${directory.directories[key].path}')\"><i class=\"fa fa-angle-right\"></i> ${key}:</li>`);
        }
    });
};

if(workspaceFiles && ( Object.keys(workspaceFiles.directories).length>0 || workspaceFiles.files.length>0)){
    $("#dropField").hide();
    $("#selection_view").show();
    writeLoadedFiles(workspaceFiles, filesListDiv);
}

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

    let file = (dir.files.filter((testFile)=>testFile.name() == pathSteps[pathSteps.length-1]))[0];

    file.data((data)=>{
        $("#dataView").html(`<div id="fileStats">
                                <h3 id="fileName"></h3>
                                <h3 id="fileSize"></h3>
                            </div>`);
        if(file.type().split("/")[0] == "text"){
            data = String.fromCharCode.apply(null, data);

            var t = $("<textarea></textarea>");
            t.val(data);
            $("#dataView").append(t);
            $("#fileName").html(`${file.name()}`);
            $("#fileSize").html(`${file.size()/1000} kb`);
        }
        if(file.type().split("/")[0] == "image"){
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL(file.original);
            
            $("#dataView").append(`<img width="100%" alt=\"${file.name()}\"src=\"${imageUrl}\">`);
            $("#fileName").html(`${file.name()}`);
            $("#fileSize").html(`${file.size()/1000} kb`);
        }
    });
}

function appendFileEntryToList(list, fileEntry){
    if(fileEntry.isFile){
        console.log("Appending ... "+fileEntry.name);
        list.append(`<li onclick=\"showData('${fileEntry.fullPath}')\">${fileEntry.name}</li>`);
    }else if(fileEntry.isDirectory){
        list.append(`<li onclick=\"toggleEntryList('${fileEntry.fullPath}')\"><i class=\"fa fa-angle-right\"></i> ${fileEntry.name}:</li>`);
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
                    //testDataSize = sample;
                    var temp = {};
                    temp.original = sample;
                    temp = Object.assign(temp, FileStruct);
        
                    temp.original = sample;
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
        filesListDiv.append(`<li onclick=\"showData('/${files[i].name}')\">${files[i].name}</li>`);

        let temp = Object.assign({}, FileStruct);
        
        temp.original = files[i];
        temp.isFile = true;
        temp.path = "";

        workspaceFiles.files=[...(workspaceFiles.files || []),temp];
    }
}