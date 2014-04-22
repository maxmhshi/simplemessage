var express = require("express");
var app = express();
var server = require("http").createServer(app);
var port = 8888;

//app.set('views', __dirname + '/tpl');
//app.set('view engine', 'jade');
//app.engine('jade', require('jade').__express);
app.use(express.static(__dirname+'/public'));
//app.use(express.bodyParser());
//app.use(express.cookieParser());
//app.use(express.session({secret: '1234567890QWERTY'}));

var io = require("socket.io").listen(server);

var rooms = {};
rooms['app1'] = ['lobby1', 'videochat'];
rooms['app2'] = ['lobby2', 'room21', 'room22'];


var appid = '';
io.set('authorization', function(req, callback){
    if (req.query.appid === undefined || req.query.appid.length === 0) {
        console.log('no appid is provided.');
        return false;
    }

    appid = req.query.appid;

    console.log('appid: '+appid);

    return callback(null, true);
});

io.sockets.on('connection', function(socket){
    console.log('Client connected from: ' + socket.handshake.address.address);

    socket.appid = appid;
    socket.join(appid);

    socket.on('adduser', function(username){
        socket.username = username;
        io.sockets.in(socket.appid).emit('updatepublishers', {publishers: rooms[socket.appid]});
    });

    socket.on('addpublisher', function(publisherName){
        rooms[socket.appid].push(publisherName);
        io.sockets.in(socket.appid).emit('updatepublishers', {publishers: rooms[socket.appid]});
    });

    socket.on('subscribe', function(publisherName){
        if (rooms[socket.appid].indexOf(publisherName) < 0) {
            io.sockets.in(socket.appid).emit('messagedown',
                {
                    user: 'system',
                    message: publisherName + ' not exists!',
                    publisher: publisherName
                }
            );
            return;
        }
        socket.publisher = publisherName;
        socket.join(publisherName);
        io.sockets.in(socket.publisher).emit('messagedown',
            {
                user: 'system',
                message: socket.username + ' are in ' + publisherName,
                publisher: publisherName
            }
        );
    });

    socket.on('unsubscribe', function(publisherName){
        if (rooms[socket.appid].indexOf(publisherName) < 0) {
            io.sockets.in(socket.appid).emit('messagedown',
                {
                    user: 'system',
                    message: publisherName + ' not exists!',
                    publisher: publisherName
                }
            );
            return;
        }
        io.sockets.in(publisherName).emit('messagedown',
            {
                user: 'system',
                message: socket.username + ' are left ' + publisherName,
                publisher: publisherName
            }
        );
        socket.leave(publisherName);
    });

    socket.on('messageup', function(data){
        io.sockets.in(data.publisher).emit('messagedown', 
            {
                user: socket.username,
                message: data.message,
                publisher: data.publisher
            }
        );
    });

    socket.on('disconnect', function(){
        io.sockets.in(socket.appid).emit('messagedown',
            {
                user: 'system',
                message: socket.username + ' are offline.',
                publisher: socket.appid
            }
        );
    });
});

server.listen(port);
