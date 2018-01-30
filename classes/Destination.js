var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var Promise = require('bluebird');

class Destination {
	constructor(data, baseUrl) {
		this.baseUrl = baseUrl
		this.data = data;
	}
	run() {
		return new Promise((resolve, reject) => {
			this._request()
				.then(this._parse.bind(this))
				.then((parsedData) => {
					this.data.weather = parsedData
					return resolve(this.data);
				})
				.catch(reject)
		});
	}
	_request() {
		return new Promise((resolve, reject) => {
			console.log('Destination', this.data.identifier,  '_request');
			request({
				uri: this.baseUrl + 'skigebieden/' + this.data.identifier + '/weersverwachting'
			}, (error, response, body) => {
				if (error) {
					return reject(error);
				}
				fs.writeFileSync('dest.html', body.toString());
				return resolve(body);
			})
		});
	}
	_parse(data) {
		return new Promise((resolve, reject) => {
			var $ = cheerio.load(data);
			var weatherTable = $(".weathertable").get(1);
			var obj = {
				weatherType: [],
				tempMountain: [],
				tempVillage: [],
				wind: [],
				snowMountain: [],
				snowVillage: [],
				sun: []
			}
			$(weatherTable).find('tbody tr').each((idx, itm) => {
				try {
					if ($(weatherTable).find('tbody tr').length == 8) {
						switch(idx) {
							case 0:
								// icons
								$(itm).find('td').each((innerIdx, innerItem) => {
									obj.weatherType.push($(innerItem).find('i').attr('class').replace('ws ws-zp ws-2x ', ''));
								});
								break;
							case 1:
								// temp mountain
								$(itm).find('td').each((innerIdx, innerItem) => {
									obj.tempMountain.push(parseInt($(innerItem).html()));
								});
								break;
							case 2:
								// temp village
								$(itm).find('td').each((innerIdx, innerItem) => {
									obj.tempVillage.push(parseInt($(innerItem).html()));
								});
								break;
							case 3:
								// wind
								$(itm).find('td').each((innerIdx, innerItem) => {
									obj.wind.push(parseInt($(innerItem).find('small').html()));
								});
								break;
							case 4:
								// zero line
								break;
							case 5:
								// snowfall
								$(itm).find('td').each((innerIdx, innerItem) => {
									var snowMountain = parseInt($(innerItem).attr('data-value'));
									var snowVillage = parseInt($(innerItem).attr('data-value-valley'));
									obj.snowMountain.push(snowMountain);
									obj.snowVillage.push(snowVillage);
								});
								break;
							case 6:
								// sun
								$(itm).find('td').each((innerIdx, innerItem) => {
									var sunNumber = parseInt($(innerItem).attr('class').replace('sungrade-', ''));
									obj.sun.push(sunNumber);
								});
								break;
						}
					} else {
						switch(idx) {
							case 0:
								// icons
								$(itm).find('td').each((innerIdx, innerItem) => {
									obj.weatherType.push($(innerItem).find('i').attr('class').replace('ws ws-zp ws-2x ', ''));
								});
								break;
							case 1:
								// temp mountain
								$(itm).find('td').each((innerIdx, innerItem) => {
									obj.tempMountain.push(parseInt($(innerItem).html()));
								});
								break;
							case 2:
								// wind
								$(itm).find('td').each((innerIdx, innerItem) => {
									obj.wind.push(parseInt($(innerItem).find('small').html()));
								});
								break;
							case 3:
								// zero line
								break;
							case 4:
								// snowfall
								$(itm).find('td').each((innerIdx, innerItem) => {
									var snowMountain = parseInt($(innerItem).attr('data-value'));
									var snowVillage = parseInt($(innerItem).attr('data-value-valley'));
									obj.snowMountain.push(snowMountain);
									obj.snowVillage.push(snowVillage);
								});
								break;
							case 5:
								// sun
								$(itm).find('td').each((innerIdx, innerItem) => {
									var sunNumber = parseInt($(innerItem).attr('class').replace('sungrade-', ''));
									obj.sun.push(sunNumber);
								});
								break;
						}
					}
				} catch (e) {
					// Happens if not the right amount of TRs -> no seperate temps for village/mountain -> crappy area anyways
					console.error('Erroring parsing', e, this.data.identifier);
					fs.writeFileSync(this.data.identifier + '.html', data);
				}
			})

			return resolve(obj);
		});
	}
}

module.exports = Destination;
