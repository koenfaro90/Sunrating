var fs = require('fs');
var _ = require('underscore');

var data = JSON.parse(fs.readFileSync('data.json').toString());

_.each(data, (area) => {
	var sunRating = area.weather.sun[2] + area.weather.sun[3] + area.weather.sun[4];
	area.sunRating = sunRating;
})

data = _.sortBy(data, 'sunRating');

_.each(data, (area) => {
	if (area.country != 'se' && area.country != 'no' && area.country != 'es') {
		if (area.totalPisteLength > 200 && area.distanceToUtrecht < 1000) {
			console.log(area.name, area.country, 'Sun: ' + area.sunRating, 'Pistes: ' + area.totalPisteLength, 'Snow: ' + area.snowDepth, 'Distance: ' + area.distanceToUtrecht);
		}
	}
})
