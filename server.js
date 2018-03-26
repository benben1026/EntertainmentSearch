const express = require('express')
const request = require('request')
const cors = require('cors')
const url = require('url')

const app = express()
const port = 8888

app.use(cors())

function geocode(callback, location){
    request('https://maps.googleapis.com/maps/api/geocode/json?address=' + location + '&key=' + process.env.API_KEY, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            result = JSON.parse(body);
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


function nearbysearch(callback, lat, lng, radius, type, keyword){
	var request_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" 
		+ lat + "," + lng + "&radius=" + radius + "&type=" + type + "&keyword=" + keyword + "&key=" + process.env.API_KEY;
	request(request_url, function(error, response, body){
		if (!error && response.statusCode == 200) {
            result = JSON.parse(body);
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
    }, qdata.lat, qdata.lng, qdata.radius, qdata.type, qdata.keyword);
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
	        res.send(nearbysearch_callback(err, data))
	    }, qdata.lat, qdata.lng, qdata.radius, qdata.type, qdata.keyword);
	} else if(qdata.from == "customized"){
		geocode(function(err, data){ 
	        if(err) {
	        	res.send(JSON.stringify({"status": "CANNOT_GET_GEOCODE"}))
	        	return;
	        }
	        nearbysearch(function(err, data){
	        	res.send(nearbysearch_callback(err, data))
	        }, data.lat, data.lng, qdata.radius, qdata.type, qdata.keyword)
	    }, qdata.location);
	} else {
		res.send(JSON.stringify({"status": "INVALID_PARAMETER"}));
	}
})


if (process.env.API_KEY == 'undefined'){
	console.log("API KEY not set");
}else{
	app.listen(port, () => console.log('Server listening on port ' + port))
}
