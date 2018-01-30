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
			console.log('Destination', this.data.identifier,  '_request', this.baseUrl + 'skigebieden/' + this.data.identifier + '/weersverwachting');
			request({
				uri: this.baseUrl + 'skigebieden/' + this.data.identifier + '/weersverwachting'
			}, (error, response, body) => {
				if (error) {
					return reject(error);
				}
				//console.log('body', body);
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
				snow: [],
				sun: []
			}
			$(weatherTable).find('tbody tr').each((idx, itm) => {
				try {
					if ($(weatherTable).find('tbody tr').length == 13) {
						switch(idx) {
							case 0:
								// icons
								$(itm).find('td').each((innerIdx, innerItem) => {
									let src = $(innerItem).find('img').get(0).attribs.src;
									let splits = src.split('weather/');
									let iconName = splits[1];
									let icon = null;
									obj.weatherType.push(iconName);
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
							case 6:
								// snowfall
								$(itm).find('td').each((innerIdx, innerItem) => {
									let div = $(innerItem).find('div');
									if (div.length == 1) {
										let data = div.get(0).children[0].data;
										var snow = parseInt(data);
										obj.snow.push(snow);
									
									} else {
										obj.snow.push(0);
									}
									
								});
								break;
							case 11:
								// sun
								$(itm).find('td').each((innerIdx, innerItem) => {
									try {
										var sunNumber = parseInt($(innerItem).attr('class').replace('sungrade-', ''));
										obj.sun.push(sunNumber);
									} catch (e) {
										console.log(e);
										obj.sun.push(-9999999);
									}
								});
								break;
						}
					} else {
						switch(idx) {
							case 0:
								// icons
								$(itm).find('td').each((innerIdx, innerItem) => {
									let src = $(innerItem).find('img').get(0).attribs.src;
									let splits = src.split('weather/');
									let iconName = splits[1];
									let icon = null;
									obj.weatherType.push(iconName);
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
							case 5:
								// snowfall
								$(itm).find('td').each((innerIdx, innerItem) => {
									let div = $(innerItem).find('div');
									if (div.length == 1) {
										let data = div.get(0).children[0].data;
										var snow = parseInt(data);
										obj.snow.push(snow);
									
									} else {
										obj.snow.push(0);
									}
									
								});
								break;
							case 10:
								// sun
								$(itm).find('td').each((innerIdx, innerItem) => {
									try {
										var sunNumber = parseInt($(innerItem).attr('class').replace('sungrade-', ''));
										obj.sun.push(sunNumber);
									} catch (e) {
										console.log(e);
										obj.sun.push(-9999999);
									}
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
