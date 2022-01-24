
var filesListDiv = $("#selectedFiles");
var stored = {};

function onFileDrop(event){
    event.preventDefault();

    var items = event.dataTransfer.items; 
    for(let i=0; i<items.length; ++i){
        let item = items[i].webkitGetAsEntry();
        stored = JSON.parse(window.sessionStorage.getItem("files"));

        appendFileEntryToList(filesListDiv, item);
        loadFileData(item, stored)
            .then((loaded)=>{
                console.log(loaded);
                console.log(JSON.parse(JSON.stringify(loaded)));
                window.sessionStorage.setItem("files", JSON.stringify(loaded));
                console.log("SessionStorage updated");
                console.log(JSON.parse(window.sessionStorage.getItem("files")));
            });
    }
}

function appendFileEntryToList(list, file){
    if(file.isFile){
        list.append(`<li>${file.name}</li>`);
    }else if(file.isDirectory){
        list.append(`<li>${file.name}:</li>`);
        var dirList = $("<ul></ul>");

        var reader = file.createReader();
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
                entry.file(function(sample){
                    let temp = Object.assign({}, FileStruct);
        
                    temp.name = sample.name;
                    temp.type = sample.type;
                    temp.size = sample.size;
                    temp.data = new Uint8Array(sample.arrayBuffer());
                    temp.isFile = true;
                    temp.path = entry.fullPath;
        
                    directory.files=[...(directory.files || []),temp];
                });
            }else if(entry.isDirectory){
                var temp = Object.assign({}, DirectoryStruct);
                temp.directories = [];
                temp.path = entry.fullPath;
        
                var reader = entry.createReader();
                reader.readEntries((entries)=>{
                    for (var i = 0; i < entries.length; i++) {
                        handleEntry(entries[i], temp);
                    }
                });
        
                directory.directories = [...(directory.directories || []),temp];
            }
        }
        handleEntry(entry, directory);

        resolve(directory);
    });
    
}

function onDragOver(event){
    event.preventDefault();

    event.dataTransfer.dropEffect = 'copy'
}

$('#file').on('input', function (e) {
   	var files = e.target.files;
    for(let i=0;i<files.length;++i){
        appendFileEntryToList(filesListDiv, files[i]);
    }
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
});

/*"{
    "directories":{
        "assets":{
            "directories":{},
            "files":[],
            "path":"/assets"}
        },
        "files":[],
        "path":""
    }" */