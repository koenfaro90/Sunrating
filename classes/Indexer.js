var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var Promise = require('bluebird');

class Indexer {
	constructor(baseUrl) {
		this.baseUrl = baseUrl;
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
				uri: this.baseUrl + 'skigebieden?sort=_score&sortdir=desc&page=1&size=500'
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

module.exports = Indexer;
