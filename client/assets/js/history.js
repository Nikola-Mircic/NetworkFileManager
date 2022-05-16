
function print({logs}){
    for(let i=0;i<logs.length-1;++i){
        $("#history").append(`<div class="file_data">
                                <p>
                                    <span style="font-weight: bold">File name:</span>
                                    <span style="color:#eee;">${logs[i].filename}</span>
                                </p>
                                <div class="file_stats">
                                    <p>
                                        <span style="font-weight: bold">Sender:</span>
                                        <span style="color:#eee;">${logs[i].from}</span>
                                    </p>
                                    <p>
                                        <span style="font-weight: bold">Receiver:</span>
                                        <span style="color:#eee;">${logs[i].to}</span>
                                    </p>
                                    <p>
                                        <span style="font-weight: bold">Time:</span>
                                        <span style="color:#eee;">${logs[i].time}</span>
                                    </p>
                                </div>
                              </div>`);
    }

    $(".file_data").on("click",(event)=>{
        event.currentTarget.children[1].toggleAttribute("visible");
    });
}

fetch(window.location.origin+"/get-history")
    .then((data)=>data.body)
    .then((data)=>{
        data.getReader().read().then(({done,value})=>{
            value = new TextDecoder().decode(value);
            print(JSON.parse(value));
        })
    });

(function(){
    var head = document.getElementsByTagName("head")[0];
    var link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", "./assets/css/history.css");
    link.setAttribute("name", "css");

    document.getElementsByName("css").forEach((node)=>node.remove());

    head.append(link);

    updateUser(window.sessionStorage.getItem("username"));
})();

