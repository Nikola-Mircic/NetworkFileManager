fetch(window.location.origin+'/get-user-ip').then((ip)=>{
    if(!ip) return;

    ip.text().then((value)=>{
        $("#ipv4").html(value);
    });
})

$(".headerContainer").on('click', ()=>{
    console.log("Clicked header!");
    $("#headerContainer").toggle();
    $("#userIpAddr").toggle();
});

var onUsersUpdate=()=>{
    $("#users").empty();
    activeUsers.forEach(({name, id}, idx)=>{
        console.log(`Name: ${name}, ID: ${id}, Index: ${idx}`);
        var newCard = $("<button class='user-card'></button>");
        newCard.append(`<h1>Name: ${name}</h1><br>`);
        newCard.append(`<p><b>ID:</b> ${id}</p><br>`);
        newCard.on('click',()=>{
            sendToUser(name, id);
        });
        $("#users").append(newCard);
    })
}

function sendToServer(){
    var package = new FormData();

    extractFiles(workspaceFiles).forEach((file)=>{
        package.append('file', file.original);
    });

    fetch('/',{
        method:'POST',
        body: package
    }).then(() => alert("Data is sent"));
}

(function(){
    var head = document.getElementsByTagName("head")[0];

    document.getElementsByName("css").forEach((node)=>node.remove());

    var link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", "./assets/css/sent.css");
    link.setAttribute("name", "css");

    head.append(link);

    //Update server address on SEND page
    $("#srvr-btn").html(`${window.location.host}`);

    onUsersUpdate();
    updateUser(window.sessionStorage.getItem("username"));
})();