const DOMAIN = "http://localhost:8888"

function init(){
	$.ajax({
		url: "http://ip-api.com/json",
		dataType: "json",
		success: function(data){
			client_lat = data['lat'];
			client_lng = data['lon'];
		},
		error: function(){
			console.log("Cannot get client coordinate")
		}
	})


	$("#search-form").submit(function(event){
		event.preventDefault();
		var url = DOMAIN + "/search?keyword=" + $('#keyword').val() 
				+ "&radius=" + parseInt($('#distance').val()) * 1609.34 
				+ "&from=" + ($('[name="from"]')[0].checked ? "here" : "customized")
				+ "&category=" + $('#category').val()
				+ "&location=" + $('#location').val()
				+ "&lat=" + client_lat
				+ "&lng=" + client_lng;
		console.log(url)
		$.ajax({
			url: url,
			type: 'get',
			dataType: 'json',
			success: function(data){console.log(data)}
		})
	});
}

$(window).on("load", init);