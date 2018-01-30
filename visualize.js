var fs = require('fs');
var Promise = require('bluebird');
var Visualizer = require('./classes/Visualizer.js');

var arrival = '2017-02-07';
var departure = '2017-02-10';

new Visualizer(JSON.parse(fs.readFileSync('./data.json').toString()), arrival, departure).run();
