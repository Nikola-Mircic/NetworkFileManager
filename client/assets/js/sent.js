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

(function(){
    var head = $("head");
    var link = $("<link rel='stylesheet' type='text/css' href='./assets/css/sent.css'>");
    head.append(link);
    onUsersUpdate();
    updateUser(window.sessionStorage.getItem("username"));
})();