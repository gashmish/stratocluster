
/* Import modules */
var config = require('./config')
require('./utils');


/* Create server */
var http = require('http').createServer()
,   io = require('socket.io').listen(http)
http.listen(config.web.port);


/* Init Postgres connection */
var Pg = require('pg')
,   pg = new Pg.Client(
        'tcp://' + config.pg.user + 
        ':' + config.pg.password +
        '@' + config.pg.host +
        '/' + config.pg.dbname);
pg.connect();


/* Init logging */
/*
var fs = require('fs')
,   Log = require('log')
,   log = new Log(Log.INFO, fs.createWriteStream(config.log.file));
*/

io.sockets.on('connection', function (socket) {
    initRequestProcessing(socket);
});


function initRequestProcessing(socket) {
    
    socket.on('getCalls', function (data) {
        console.log('getCalls: ' + data);
        
        pg.query("SELECT call FROM calls;", function (err, result) {
            if (err) {
                console.log(err);
            } else {
                var calls = [];
                result.rows.forEach(function(row) {
                    console.log(row);
                    var call  = JSON.parse(row.call);
                    calls.push(call);
                });
                socket.emit('calls', { calls : calls });
            }
        });
    });

    socket.on('addCall', function (data) {
        console.log(data);
        
        pg.query(
            "INSERT INTO calls(call) VALUES('{0}');"
            .format(
                JSON.stringify(data.call)));
    });

    socket.on('removeCall', function (data) {
        console.log(data);

        pg.query(
            "DELETE FROM calls WHERE call = '{0}';"
            .format(
                JSON.stringify(data.call)));
    });
}

