const express = require('express')
const request = require('request')
const cors = require('cors')
const url = require('url')
const path = require('path')
const querystring = require('querystring');
const apikey = require('./Assets/apikey')

const app = express()
const port = 8080

app.use(cors())

// console.log(apikey.googleKey());
// console.log(apikey.yelpKey());

function geocode(callback, location){
    request('https://maps.googleapis.com/maps/api/geocode/json?address=' + location + '&key=' + apikey.googleKey(), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            result = {"lat": result['results'][0]['geometry']['location']['lat'], 
            	"lng": result['results'][0]['geometry']['location']['lng']}
            return callback(null, result);
        } else {            
            return callback(error, null);;
        }
    });
}

app.get('/geocode', function(req, res){
	var q = url.parse(req.url, true);
	var qdata = q.query;
	geocode(function(err, data){ 
        if(err) return res.send(err);       
        res.send(JSON.stringify(data));
    }, qdata.location);
})


function nearbysearch(callback, lat, lng, radius, category, keyword){
	var request_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" 
		+ lat + "," + lng + "&radius=" + radius + "&type=" + category + "&keyword=" + keyword + "&key=" + apikey.googleKey();
	request(request_url, function(error, response, body){
		if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            return callback(null, result);
        } else {            
            return callback(error, null);;
        }
	})
}

app.get('/nearbysearch', function(req, res){
	var q = url.parse(req.url, true);
	var qdata = q.query;
	nearbysearch(function(err, data){ 
        if(err) return res.send(err);       
        res.send(JSON.stringify(data));
    }, qdata.lat, qdata.lng, qdata.radius, qdata.category, qdata.keyword);
})

function nextPage(callback, token){
	var request_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=" + token + "&key=" + apikey.googleKey();
	request(request_url, function(error, response, body){
		if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            return callback(null, result);
        } else {            
            return callback(error, null);;
        }
	})
}

app.get('/nextpage', function(req, res){
	var qdata = url.parse(req.url, true).query;
	if (!'pagetoken' in qdata){
		res.send(JSON.stringify({status: "INVALID_PARAMETER"}));
		return;
	}
	nextPage(function(err, data){
		if(err) return res.send(err);       
        res.send(JSON.stringify(data));
	}, qdata.pagetoken)
})

function nearbysearch_callback(err, data){
	if(err) {
    	return JSON.stringify({"status": "ERROR", "msg": err});
    }
    var output = {"status": "OK", "data":Array()};
	for(var t in data['results']){
		output['data'].push({
			"name": data['results'][t]['name'],
			"icon": data['results'][t]['icon'],
			"address": data['results'][t]['vicinity'],
			"id": data['results'][t]['place_id'],
		})
	}
	return JSON.stringify(output);
}

app.get('/search', function(req, res){
	var qdata = url.parse(req.url, true).query;
	if (qdata.from == "here"){
		nearbysearch(function(err, data){ 
	        //res.send(nearbysearch_callback(err, data))
	        if(err) {
		    	return JSON.stringify({"status": "ERROR", "msg": err});
		    }
		    res.send(JSON.stringify(data));
	    }, qdata.lat, qdata.lng, qdata.radius, qdata.category, qdata.keyword);
	} else if(qdata.from == "customized"){
		geocode(function(err, data){ 
	        if(err) {
	        	res.send(JSON.stringify({"status": "CANNOT_GET_GEOCODE"}))
	        	return;
	        }
	        nearbysearch(function(err, data){
	        	//res.send(nearbysearch_callback(err, data))
	        	if(err) {
			    	return JSON.stringify({"status": "ERROR", "msg": err});
			    }
			    res.send(JSON.stringify(data));
	        }, data.lat, data.lng, qdata.radius, qdata.category, qdata.keyword)
	    }, qdata.location);
	} else {
		res.send(JSON.stringify({"status": "INVALID_PARAMETER"}));
	}
})

function placedetail(callback, place_id){
	var request_url = "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + place_id + "&key=" + apikey.googleKey();
	request(request_url, function(error, response, body){
		if (!error && response.statusCode == 200){
			var result = JSON.parse(body);
			return callback(null, result);
		} else {
			return callback(error, null);
		}
	})
}

app.get('/placedetail', function(req, res){
	var qdata = url.parse(req.url, true).query;
	placedetail(function(err, data){
		if (err){
			res.send({'status': 'ERROR', 'msg': err})
			return;
		}
		res.send(JSON.stringify(data));
	}, qdata.id)
})

function yelpGetReviews(callback, id){
	request({
		url: "https://api.yelp.com/v3/businesses/" + id + "/reviews",
		headers: {
			"Authorization": "Bearer " + apikey.yelpKey()
		}},
		function(error, response, body){
			if (!error && response.statusCode == 200){
				var result = JSON.parse(body);
				return callback(null, result);
			} else {
				return callback(error, null);
			}
		}
	);
}

function yelpGetId(callback, input_para){
	//console.log("https://api.yelp.com/v3/businesses/matches/best?" + querystring.stringify(input_para))
	request({
		url: "https://api.yelp.com/v3/businesses/matches/best?" + querystring.stringify(input_para),
		headers: {
			"Authorization": "Bearer " + apikey.yelpKey()
		}},
		function(error, response, body){
			if (!error && response.statusCode == 200){
				var result = JSON.parse(body);
				//console.log(result);
				return callback(null, result);
			} else {
				return callback(error, null);
			}
		}
	)
}

app.get('/getyelpreviews', function(req, res){
	if (!apikey.yelpKey()){
		res.send(JSON.stringify({status: 'ERROR', msg:'API_KEY_NOT_SET'}));
		return;
	}
	var qdata = url.parse(req.url, true).query;
	var param = {
		name: querystring.unescape(qdata.name),
		city: querystring.unescape(qdata.city),
		state: querystring.unescape(qdata.state),
		country: querystring.unescape(qdata.country),
		address1: querystring.unescape(qdata.address),
		postal_code: querystring.unescape(qdata.postal)
	}
	yelpGetId(function(err, data){
		if (err){
			res.send({status: err})
			return;
		}
		//console.log(data);
		if (data['businesses'].length == 0){
			res.send({status: 'NO_BUSINESE_FOUND'})
			return;
		}
		yelpGetReviews(function(err, data){
			if (err){
				res.send({status: err})
				return;
			}
			res.send(JSON.stringify({status: 'OK', data: data}));
		}, data['businesses'][0]['id'])
	}, param);
})

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
})

app.use(express.static(__dirname + '/Assets/'));


app.listen(port, () => console.log('Server listening on port ' + port))
