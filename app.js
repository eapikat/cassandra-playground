'use strict';

/*!
 * cassandra-playground
 * Copyright(c) 2015 Barchart.com, Inc. All Rights Reserved.
 */

/*
 * The file is called app.js so that it conforms, more or
 * less, to the way AWS ElasticBeanstalk is set up.
 *
 * The important files in this folder are:
 * app.js (this file)
 * package.json (which contains all of the dependencies)
 * .gitignore
 */

/*
 * Core includes.
 */

var express = require('express');
var app = express();
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);

var cassandra = new require('cassandra-driver');
var client = new cassandra.Client({ contactPoints: ['localhost'] });


var settings = {
	"port" : process.env.PORT || 8081,
	"documentRoot" : __dirname,
};

server.listen(settings.port);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});


io.on('connection', function(socket) {
	socket.emit('connected', {});

	socket.on('disconnect', function() {
	});

	socket.on('getKeyspaces', function() {
		client.execute('SELECT keyspace_name FROM system.schema_keyspaces;', function(err, data) {
			var values = [];
			for (var i = 0; i < data.rows.length; i++) {
				values.push(data.rows[i].keyspace_name);
			}
			socket.emit('getKeyspaces', { keyspaces: values });
		});
	});

	socket.on('getTables', function(data) {
		client.execute("SELECT columnfamily_name FROM system.schema_columnfamilies WHERE keyspace_name = '" + data.keyspace + "'", function(err, data) {
			var values = [];
			for (var i = 0; i < data.rows.length; i++) {
				values.push(data.rows[i].columnfamily_name);
			}
			socket.emit('getTables', { tables: values });
		});
	});

	socket.on('runQuery', function(data) {
		client.execute(data.query, function(err, data) {
			console.log(err);
			console.log(data);
		});
	});
});
