var filesListDiv = $("#selectedFiles");

function onFileDrop(event){
    event.preventDefault();

    var items = event.dataTransfer.items; 
    for(let i=0; i<items.length; ++i){
        let item = items[i].webkitGetAsEntry()
        console.log(item);
        appendFileToList(filesListDiv, item);
    }
}

function appendFileToList(list, file){
    if(file.isFile){
        console.log(`${file.name} was a file`);
        list.append(`<li>${file.name}</li>`);
    }else if(file.isDirectory){
        console.log(`${file.name} was a directory`);
        list.append(`<li>${file.name}:</li>`);
        var dirList = $("<ul></ul>");

        var reader = file.createReader();
        reader.readEntries((entries)=>{
            for (var i = 0; i < entries.length; i++) {
                appendFileToList(dirList, entries[i]);
            }
        });

        list.append(dirList);
    }
}

function onDragOver(event){
    event.preventDefault();
}

$('#file').on('input', function (e) {
   	var files = e.target.files;
    
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