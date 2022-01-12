$(".nav li button").on('click',function(){
    $(".nav li button").removeAttr("active");
    $(this).attr("active","");
});