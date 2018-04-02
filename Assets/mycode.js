//const DOMAIN = "http://localhost:8888"
const DOMAIN = ""

function set_place_detail(place, status){
	// console.log(status)
	// console.log(place)
	if (status == google.maps.places.PlacesServiceStatus.OK){
		set_info(place);
		set_map(place);
		setStreetView();
		set_photo(place);
		set_google_reviews(place);
		set_yelp_reviews(place);
	}
}

function set_info(data){
	$('#info').html('')
	$('#info').append('<tr><td>Address</td><td>' + data['adr_address'] + '</td></tr>');
	if (data['international_phone_number'])
		$('#info').append('<tr><td>Phone Number</td><td>' + data['international_phone_number'] + '</td></tr>');
	if (data['price_level'])
		$('#info').append('<tr><td>Price Level</td><td>' + data['price_level'] + '</td></tr>');
	if (data['rating'])
		$('#info').append('<tr><td>Rating</td><td>' + data['rating'] + '</td></tr>');
	if (data['url'])
		$('#info').append('<tr><td>Google Page</td><td><a target="__blank" href="' + data['url'] + '">' + data['url'] + '</a></td></tr>');
	if (data['website'])
		$('#info').append('<tr><td>Website</td><td><a target="__blank" href="' + data['website'] + '">' + data['website'] + '</a></td></tr>');
	if (data['opening_hours']){
		var innerhtml = "";
		var currentdate = new Date(Date.now() + (new Date().getTimezoneOffset() * 60000) - parseInt(data['utc_offset']) * 60000) ;
		var day = currentdate.getDay();
		if (data['opening_hours']['open_now']){
			innerhtml += "Open " + data['opening_hours']['weekday_text'][day];
		} else {
			innerhtml += "Closed"
		}
		innerhtml += "&nbsp;&nbsp;<a>Daily open hours</a>"
		$('#info').append('<tr><td>Hours</td><td>' + innerhtml + '</td></tr>');
	}

}

function set_photo(data){
	if (!('photos' in data) || data.photos.length == 0){
		return;
	}
	$('.photo-container').html('');
	var photo_container_index = 0;
	for(var i in data.photos){
		if (photo_container_index >= 4){
			photo_container_index = 0;
		}
		var maxwidth = data.photos[i]['width'];
		var thumbnail_url = data.photos[i].getUrl({maxWidth: 200});
		var photo_url = data.photos[i].getUrl({maxWidth: maxwidth});
		$('div.photo-container:eq(' + photo_container_index + ')').append('<a target="__blank" href="' + photo_url + '"><img class="thumbnail" style="width:100%" src="' + thumbnail_url + '"></a>')
		photo_container_index += 1;
	}
}

function set_map(data){
	if (marker)
		marker.setMap(null);
	$('#map-to').val(data.name);
	$('#map-from').val("Your location");
	destLat = data['geometry']['location']['lat']();
	destLng = data['geometry']['location']['lng']();
	var name = data['name']
	var latLng = new google.maps.LatLng({lat: parseFloat(destLat), lng:parseFloat(destLng)});
	marker = new google.maps.Marker({
		position: latLng,
		map: map,
		title: name
	});
	map.setCenter(latLng);
	// panorama = new google.maps.StreetViewPanorama(
	// 	document.getElementById("street-view"), {
	// 		position: {lat: parseFloat(destLat), lng: parseFloat(destLng)},
	// 		pov: {
	// 			heading: 34,
	// 			pitch: 10
	// 		}
	// 	})
	//map.setStreetView(panorama);
}

function getDirection(){
	if ($('#map-from').val().trim().toLowerCase() == "your location"){
		fromLocationLat = client_lat;
		fromLocationLng = client_lng;
		calculateAndDisplayRoute();
		return;
	}
	$.ajax({
		url: DOMAIN + "/geocode?location=" + encodeURIComponent($('#map-from').val()),
		dataType: 'json',
		success: function(data){
			fromLocationLat = data['lat'];
			fromLocationLng = data['lng'];
			calculateAndDisplayRoute();
		},
		error: function(){
			console.log('error');
		}
	})
}

function calculateAndDisplayRoute(){
	if (marker)
		marker.setMap(null);
	directionsService.route({
		origin: {lat: parseFloat(fromLocationLat), lng: parseFloat(fromLocationLng)}, 
		destination: {lat: parseFloat(destLat), lng: parseFloat(destLng)},
		travelMode: google.maps.TravelMode[$('#travel-mode').val()],
		provideRouteAlternatives: true
	}, function(response, status){
		if (status == 'OK') {
			directionsDisplay.setDirections(response);
			directionsDisplay.setPanel(document.getElementById("routeSteps"))
		} else {
			window.alert('Directions request failed due to ' + status);
		}
	})
}

function setStreetView(){
	//map.getStreetView().setPosition({lat: parseFloat(destLat), lng: parseFloat(destLng)})
	//panorama.setPosition({lat: parseFloat(destLat), lng: parseFloat(destLng)});
	
	panorama = new google.maps.StreetViewPanorama(
		document.getElementById("street-view"), {
			position: {lat: parseFloat(destLat), lng: parseFloat(destLng)},
			pov: {
				heading: 34,
				pitch: 10
			}
		})
	
}

function set_google_reviews(data){
	for (var i in data.reviews){
		var profile = '<img src="' + data.reviews[i].profile_photo_url + '">';
		var name = '<span>' + data.reviews[i].author_name + '</span>';
		var rating = data.reviews[i].rating;
		var date = new Date(parseInt(data.reviews[i].time));
		var comment = data.reviews[i].text;
		$('#google-reviews').append('<li class="list-group-item">' + profile + name + rating + date + comment + '</li>')
	}
}

function set_yelp_reviews(data){
	for (var i in data.address_components){
		if ($.inArray('country', data.address_components[i].types) > -1){
			var country = data.address_components[i].short_name;
		} else if($.inArray('administrative_area_level_1', data.address_components[i].types) > -1){
			var state = data.address_components[i].short_name;
		} else if($.inArray('administrative_area_level_2', data.address_components[i].types) > -1){
			var city = data.address_components[i].short_name;
		} else if($.inArray('postal_code', data.address_components[i].types) > -1){
			var postal = data.address_components[i].short_name;
		} else if($.inArray('street_number', data.address_components[i].types) > -1){
			var street_number = data.address_components[i].short_name
		} else if($.inArray('route', data.address_components[i].types) > -1){
			var route = data.address_components[i].short_name
		}
	}
	var param = {
		name: encodeURIComponent(data['name']),
		city: encodeURIComponent(city),
		state: state,
		country: country,
		address: encodeURIComponent(street_number + " " + route),
		postal: postal
	}
	console.log(DOMAIN + "/getyelpreviews?" + $.param(param))
	$.ajax({
		url: DOMAIN + "/getyelpreviews?" + $.param(param),
		dataType: 'json',
		success: function(data){
			if (data['status'] != 'OK'){
				console.log(data['status']);
				return;
			}
			data = data['data'];
			for (var i in data.reviews){
				var profile = '<img src="' + data.reviews[i].user.image_url + '">';
				var name = '<span>' + data.reviews[i].user.name + '</span>';
				var rating = data.reviews[i].rating;
				var date = data.reviews[i].time_created;
				var comment = data.reviews[i].text;
				$('#yelp-reviews').append('<li class="list-group-item">' + profile + name + rating + date + comment + '</li>')
			}
		},
		error: function(){
			console.log('error');
		}
	})
}

function toggleIcon(){
	if (googleMapStatus == 1){
		$('#google-map-toggle-icon').attr("src", "http://cs-server.usc.edu:45678/hw/hw8/images/Pegman.png");
		// $('#map').height(0)
		// $('#street-view').height(500)
		$('#map').hide();
		$('#street-view').show();
		setStreetView();
		googleMapStatus = 0;
	} else {
		$('#google-map-toggle-icon').attr("src", "http://cs-server.usc.edu:45678/hw/hw8/images/Map.png");
		$('#street-view').hide();
		$('#map').show();
		// $('#map').height(500)
		// $('#street-view').height(0)
		googleMapStatus = 1;
	}
}

function renderSearchResult(){
	$('#results-btn').attr("class", "btn btn-primary");
	$('#favorite-btn').attr("class", "btn btn-default");
	if (typeof pageData == 'undefined'){
		$('#search-result').html('');
		return;
	}
	var result = "<tr><th>#</th><th>Category</th><th>Name</th><th>Address</th><th>Favorite</th><th>Details</th></tr>"
	var tmp = pageData[pageIndex]['results']
	for (var i in tmp){
		var star = '<button type="button" onclick="javascript:setFavorite(' + i + ')" class="btn btn-default"><span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span></button>'
		for (var j in favoriteRecord){
			if (favoriteRecord[j]['place_id'] == tmp[i]['place_id']){
				star = '<button type="button" onclick="javascript:removeFavorite(' + tmp[i]['place_id'] + ')" class="btn btn-default"><span class="glyphicon glyphicon-star" aria-hidden="true"></span></button>'
				break;
			}
		}
		result += '<tr><td>' + (parseInt(i) + 1) + '</td>' 
			+ '<td><img src=\"' + tmp[i]['icon'] + '\" /></td>' 
			+ '<td>' + tmp[i]['name'] + '</td>' 
			+ '<td>' + tmp[i]['vicinity'] + '</td>' 
			+ '<td>' + star + '</td>' 
			+ '<td><button type="button" onclick="javascript:service.getDetails({placeId: \'' + tmp[i]['place_id'] + '\'}, set_place_detail);" class="btn btn-default"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button></td></tr>'
	}
	$('#search-result').html(result);
}

function nextPage(){
	if (pageIndex < pageData.length - 1){
		pageIndex += 1;
		renderSearchResult();
		renderPagination();
	} else if('next_page_token' in pageData[pageIndex]){
		$.ajax({
			url: DOMAIN + "/nextpage?pagetoken=" + pageData[pageIndex].next_page_token,
			dataType: 'json',
			success: function(data){
				if (data.status == "OK"){
					pageData.push(data)
					pageIndex += 1;
					renderSearchResult();
					renderPagination();
				}
			},
			error: function(){
				console.log("Fail to get next page");
			}
		})
	} else {
		console.log("No next page");
	}
}

function previousPage(){
	if (pageIndex > 0){
		pageIndex -= 1;
		renderSearchResult();
		renderPagination();
	} else {
		console.log("No previous page");
	}

}

function renderPagination(){
	result = ""
	if (pageIndex > 0){
		result += '<button class="btn btn-default" onclick="previousPage()">Previous</button>';
	}
	if (pageIndex < pageData.length - 1 || 'next_page_token' in pageData[pageIndex]){
		result += '<button class="btn btn-default" onclick="nextPage()">Next</button>';
	}
	$('#pagination').html(result);
}

function setFavorite(index){
	favoriteRecord.push(pageData[pageIndex]['results'][index]);
	localStorage.setItem("favorite", JSON.stringify(favoriteRecord));
	renderSearchResult();
}

function removeFavorite(id){
	for (var i in favoriteRecord){
		if (favoriteRecord[i]['place_id'] == id){
			favoriteRecord.splice(i, 1);
			break
		}
	}
	//favoriteRecord.splice(index, 1);
	localStorage.setItem("favorite", JSON.stringify(favoriteRecord));
	renderFavoriteTab();
}

function renderFavoriteTab(){
	$('#results-btn').attr("class", "btn btn-default");
	$('#favorite-btn').attr("class", "btn btn-primary");
	var result = "<tr><th>#</th><th>Category</th><th>Name</th><th>Address</th><th>Favorite</th><th>Details</th></tr>"
	for (var i in favoriteRecord){
		result += '<tr><td>' + (parseInt(i) + 1) + '</td>' 
			+ '<td><img src=\"' + favoriteRecord[i]['icon'] + '\" /></td>' 
			+ '<td>' + favoriteRecord[i]['name'] + '</td>' 
			+ '<td>' + favoriteRecord[i]['vicinity'] + '</td>' 
			+ '<td><button type="button" onclick="javascript:removeFavorite(\'' + favoriteRecord[i]['place_id'] + '\')" class="btn btn-default"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button></td>' 
			+ '<td><button type="button" onclick="javascript:service.getDetails({placeId: \'' + favoriteRecord[i]['place_id'] + '\'}, set_place_detail);" class="btn btn-default"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button></td></tr>'
	}
	$('#search-result').html(result);
}

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
		pageData = [];
		pageIndex = -1;
		var url = DOMAIN + "/search?keyword=" + $('#keyword').val() 
				+ "&radius=" + parseInt($('#distance').val()) * 1609.34 
				+ "&from=" + ($('[name="from"]')[0].checked ? "here" : "customized")
				+ "&category=" + $('#category').val()
				+ "&location=" + $('#location-from').val()
				+ "&lat=" + client_lat
				+ "&lng=" + client_lng;
		console.log(url)
		$.ajax({
			url: url,
			type: 'get',
			dataType: 'json',
			success: function(data){
				if (data['status'] == 'OK'){
					//console.log(data);
					pageData.push(data);
					pageIndex = 0;
					renderSearchResult();
					renderPagination();
				}
			},
			error: function(){
				console.log('error');
			}
		})
	});

	$("#get-direction-btn").click(function(event){
		event.preventDefault();
		getDirection();
	})
	service = new google.maps.places.PlacesService(map);
	googleMapStatus = 1;
	marker = null;
	initAutoComplete();
	favoriteRecord = localStorage.getItem('favorite') ? JSON.parse(localStorage.getItem('favorite')) : Array();
}

function geolocate() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			var geolocation = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			var circle = new google.maps.Circle({
				center: geolocation,
				radius: position.coords.accuracy
			});
			autocompleteMap.setBounds(circle.getBounds());
		});
	}
}

function fillInAddress(){
	return;
}

function initAutoComplete(){
	autocompleteMap = new google.maps.places.Autocomplete(
        (document.getElementById('map-from')),
        {types: ['geocode']}
    );
    autocompleteMap.addListener('place_changed', fillInAddress);
    autocompleteSearch = new google.maps.places.Autocomplete(
        (document.getElementById('location-from')),
        {types: ['geocode']}
    );
    autocompleteSearch.addListener('place_changed', fillInAddress);
}

function initMap(){
	$('#map').html('');
	directionsDisplay = new google.maps.DirectionsRenderer;
	directionsService = new google.maps.DirectionsService;
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 14,
		center: {lat: 37.77, lng: -122.447},
		//streetViewControl: false,
	});
	directionsDisplay.setMap(map);
}

$(window).on("load", init);