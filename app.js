var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var Promise = require('bluebird');

var baseUrl = 'https://www.wintersporters.nl/'

class Indexer {
	constructor() {

	}
	run() {
		return new Promise((resolve, reject) => {
			this._request()
				.then(this._parse.bind(this))
				.then(resolve)
				.catch(reject)
		});
	}
	_request() {
		// Gets all ski areas
		return new Promise((resolve, reject) => {
			console.log('Indexer', '_request');
			request({
				uri: baseUrl + 'skigebieden?sort=_score&sortdir=desc&page=1&size=500'
			}, (error, response, body) => {
				if (error) {
					return reject(error);
				}
				return resolve(body);
			})
		});
	}
	_parse(data) {
		console.log('Indexer', '_parse');
		return new Promise((resolve, reject) => {
			fs.writeFileSync('data.html', data);
			var $ = cheerio.load(data);
			// Parse HTML to object with { id: 123, country: "ISO2", totalPistes: 1234, pisteDistribution: { emerald: 0, peterriver: 50, alizarin: 43, black: 7 }, distanceToUtrecht: 123, bottomAltitude: 123, topAltitude: 345, snowDepth: 125 }
			var objs = [];
			$("li.location").each((idx, val) => {
				var obj = {
					id: null,
					name: null,
					country: null,
					totalPisteLength: null,
					pisteDistribution: {

					},
					distanceToUtrecht: null,
					bottomAltitude: null,
					topAltitude: null,
					snowDepth: null
				}
				var pisteInfo = $(val).find('li.no-float');
				var pisteHtml = pisteInfo.html();
				var length = pisteHtml.substr(pisteHtml.indexOf('</i>')+4, 5).replace('km', '').trim();

				obj.id = $(val).find('input[name="comparedestination"]').val();
				obj.name = $(val).attr('data-name');
				obj.identifier = $($(val).find('a')[0]).attr('href').replace('https://www.wintersporters.nl/skigebieden/', '');
				obj.country = $(val).find('img.flag').attr('src').replace('https://static.wintersporters.nl/images/flags/svg/', '').replace('.svg', '');
				obj.totalPisteLength = parseInt(length);
				obj.pisteDistribution.green = $(pisteInfo).find('.bg-emerald').css('width');
				obj.pisteDistribution.blue = $(pisteInfo).find('.bg-peterriver').css('width');
				obj.pisteDistribution.red = $(pisteInfo).find('.bg-alizarin').css('width');
				obj.pisteDistribution.black = $(pisteInfo).find('.bg-black').css('width');
				obj.distanceToUtrecht = $($(val).find('li')[1]).html();
				obj.distanceToUtrecht = parseInt(obj.distanceToUtrecht.substr(obj.distanceToUtrecht.lastIndexOf('>')+1).replace('km').replace('van Utrecht', '').trim());

				var height = $($(val).find('li')[2]).html();
				height = height.substr(height.lastIndexOf('>')+1).split(' tot ');

				obj.bottomAltitude = parseInt(height[0].replace('m', ''));
				obj.topAltitude = parseInt(height[1].replace('m', ''));
				obj.snowDepth = $($(val).find('li')[3]).html();
				obj.snowDepth = parseInt(obj.snowDepth.substr(obj.snowDepth.lastIndexOf('>')+1).replace('cm', ''));
				objs.push(obj);
			})
			return resolve(objs);
		});
	}
}

class Destination {
	constructor(data) {
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
				uri: baseUrl + 'skigebieden/' + this.data.identifier + '/weersverwachting'
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
				} catch (e) {
					// Happens if not the right amount of TRs -> no seperate temps for village/mountain -> crappy area anyways
					console.error('Erroring parsing', this.data.identifier);
					fs.writeFileSync(this.data.identifier + '.html', data);
				}
			})

			return resolve(obj);
		});
	}
}

new Indexer().run()
	.then((data) => {
		var pList = [];
		_.each(data, (dest) => {
			pList.push(new Destination(dest));
		});
		return Promise.map(pList, (dest) => {
			return dest.run();
		}, { concurrency: 1 });
	})
	.then((data) => {
		fs.writeFileSync('data.json', JSON.stringify(data, 0, "\t"));
	})
	.catch((err) => {
		console.error('error', err);
	})
