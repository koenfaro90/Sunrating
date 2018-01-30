var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var Promise = require('bluebird');
var moment = require('moment');

class Visualizer {
	constructor(data, arrival, departure) {
		this.data = data;
		this.arrival = arrival;
		this.departure = departure;
	}
	run() {
		return new Promise((resolve, reject) => {
			this._execute()
				.then(resolve)
				.catch(reject)
		});
	}
	_execute() {
		return new Promise((resolve, reject) => {
			return resolve();
		})
	}
	_parseAverages() {
		return new Promise((resolve, reject) => {

		})
	}
	_createCSV() {
		return new Promise((resolve, reject) => {

		})
	}
	_createHTML() {
		return new Promise((resolve, reject) => {

		})
	}
}

module.exports = Visualizer;
