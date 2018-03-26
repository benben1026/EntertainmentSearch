function init(){
	$("#search-form").submit(function(event){
		event.preventDefault();
		$.ajax({
			url: "http://cs-server.usc.edu:29709/index.php?type=SUBMIT&keyword=usc&distance=10&from=here&category=default&location=&lat=34.0035&lng=-118.2873",
			type: "get",
			data: "json",
			success: function(data){alert("success")},
			errer: function(){alert("error")}
		})
	});
}

$(window).on("load", init);