var fs = require('fs');
var _ = require('underscore');
var AsciiTable = require('ascii-table');
var data = JSON.parse(fs.readFileSync('data.json').toString());

let skipDays = 2;
let numberOfDays = 7;



_.each(data, (area) => {
	var sunRating = _.reduce(area.weather.sun, (memo, num, index) => { 
		if (index >= (skipDays) && index < (skipDays + numberOfDays)) {
			return memo + num;
		} else {
			return memo;
		}
	}, 0);
	area.sunRating = sunRating;
	area.bluePisteKm = (area.totalPisteLength * (parseInt(area.pisteDistribution.blue) / 100)).toFixed(2);
	area.snowFall = _.reduce(area.weather.snow, (memo, num, index) => { 
		if (index >= (skipDays) && index < (skipDays + numberOfDays))   {
			return memo + num;
		} else {
			return memo;
		}
	}, 0)
	area.amountOfSunOnlyDays = _.reduce(area.weather.weatherType, (memo, num, index) => { 
		if (index >= (skipDays) && index < (skipDays + numberOfDays) && num == 'D.svg')   {
			return memo + 1;
		} else {
			return memo;
		}
	}, 0)
})

data = _.sortBy(data, (itm) => { return -1 * itm.sunRating });

var table = new AsciiTable('Sunrating');
table.setHeading('#', 'Gebied', 'Land', 'Rating', 'Zon', 'Zon dagen', 'Huidige sneeuw', 'Te vallen sneeuw', '% Blauw', 'Km blauw', 'Km piste');

let i = 1;
_.each(data, (area) => {
	if (area.country != 'se' && area.country != 'no' && area.country != 'es' && area.country != 'us'&& area.country != 'ca') {
		if (area.bluePisteKm > 50) {
			table.addRow(i, area.name, area.country, area.rating, area.sunRating, area.amountOfSunOnlyDays, area.snowDepth, area.snowFall, area.pisteDistribution.blue, area.bluePisteKm, area.totalPisteLength);
			i++;
		}
	}
})

console.log(table.toString());
