var filesListDiv = $("#selectedFiles");

var testDataSize = null;

function writeLoadedFiles(directory, list){
    list.empty();
    directory.files.forEach((file)=>{
        let filePath = (file.path=="")?("/"+file.name()):file.path;
        list.append(`<li onclick=\"showData('${filePath}')\">
                        <div id="fileStats">
                            <p id="fileName">${file.name()}</p>
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
                            <i class=\"fa fa-angle-down\"></i> ${key}:
                         </li>`);

            var dirList = $(`<ul id="${key}_data"></ul>`);

            writeLoadedFiles(directory.directories[key], dirList);
            list.append(dirList);
        }else{
            list.append(`<li onclick=\"toggleEntryList('${directory.directories[key].path}')\">
                            <i class=\"fa fa-angle-right\"></i> ${key}:
                         </li>`);
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

            var t = $("<textarea></textarea>");
            t.val(data);

            $("#dataView").append(t);
            $("#dataView #fileName").html(`${file.name()}`);
            $("#dataView #fileSize").html(`${file.size()/1000} kb`);

            $("textarea").on('change keyup paste', updateTextData);
        }
        if(file.type().split("/")[0] == "image"){
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL(file.original);
            
            $("#dataView").append(`<img width="100%" alt=\"${file.name()}\"src=\"${imageUrl}\">`);
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
    /*console.log("Textarea update")*/
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
            temp.path = entry.fullPath;

            directory.files=[...(directory.files || []),temp];

            writeFunc();
        });
    }else if(entry.isDirectory){
        var temp = Object.assign({}, DirectoryStruct);
        temp.directories = {};
        temp.path = entry.fullPath;

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

function onFileDrop(event){
    event.preventDefault();

    $("#dropField").hide();
    $("#selection_view").show();

    var items = event.dataTransfer.items; 
    for(let i=0; i<items.length; ++i){
        let item = items[i].webkitGetAsEntry();

        loadFileData(item, workspaceFiles, function(){
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
                                    <p id="fileName">${files[i].name}</p>
                                    <p id="fileSize">${files[i].size/1000} kb</p>
                                </div>
                            </li>`);

        let temp = Object.assign({}, FileStruct);
        
        temp.original = files[i];
        temp.isFile = true;
        temp.path = "";

        workspaceFiles.files=[...(workspaceFiles.files || []),temp];
    }
}