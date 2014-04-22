/*
 * Simple messager based on socket.io
 */

function SimpleMessager(appid, user) {
    var me = this;

    me.socketServer = 'http://54.244.115.141:8888';

    me.user = user;
    me.appid = appid;
    me.onMessageCallbacks = {}; 

    me.socket = io.connect(me.socketServer, {
        query: 'appid='+appid
    });
    me.socket.emit('adduser', user);
    me.socket.on('messagedown', function(data){
        if (me.onMessageCallbacks[data.publisher] != undefined) {
            me.onMessageCallbacks[data.publisher](data);
        }
    });
    
    me.addPublisher = function(publisherName){
        me.socket.emit('addpublisher', publisherName);
    };

    me.onPublishers = function(callback) {
        me.socket.on('updatepublishers', callback);
    };

    me.subscribe = function(publisherName, onMessageCallback) {
        me.socket.emit('subscribe', publisherName);

        if (onMessageCallback != undefined) {
            me.onMessageCallbacks[publisherName] = onMessageCallback;
        }
    };

    me.unsubscribe = function(publisherName) {
        me.socket.emit('unsubscribe', publisherName);
    };

    me.subscribeSys = function(onMessageCallback) {
        me.onMessageCallbacks[me.appid] = onMessageCallback;
    };

    me.onMessage = function(callback) {
        me.socket.on('messagedown', callback);
    };

    me.sendMessage = function(message) {
        me.socket.emit('messageup', message);
    };

    return me;
}
