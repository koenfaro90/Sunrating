var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var Promise = require('bluebird');

var Indexer = require('./classes/Indexer.js');
var Destination = require('./classes/Destination.js');
var Visualizer = require('./classes/Visualizer.js');

var baseUrl = 'https://www.wintersporters.nl/';
var arrival = '2017-02-07';
var departure = '2017-02-10';

new Indexer(baseUrl).run()
	.then((data) => {
		var pList = [];
		_.each(data, (dest) => {
			pList.push(new Destination(dest, baseUrl));
		});
		return Promise.map(pList, (dest) => {
			return dest.run();
		}, { concurrency: 1 });
	})
	.then((data) => {
		fs.writeFileSync('data.json', JSON.stringify(data, 0, "\t"));
		return data;
	})
	.then((data) => {
		return new Visualizer(data, arrival, departure).run();
	})
	.catch((err) => {
		console.error('error', err);
	})
