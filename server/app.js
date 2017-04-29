var app = require('express')();
var q = require('q');
var http = require('http');
var bodyParser = require('body-parser');
app.use(bodyParser.json());    
var morgan = require('morgan');
app.use(morgan('tiny'));

app.get('/channels', function(req, res){
    getChannels(res)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));
});

app.post('/channels', function(req, res){
    channel = req.body;
    postChannel(req, res, channel)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));
});

app.get('/channels/:cid', function(req, res){
    var cid = req.params.cid;

    getChannelById(res, cid)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

});

app.delete('/channels/:cid', function(req, res){
    var cid = req.params.cid;
    deleteChannelById(res, cid)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));
});

app.post('/channels/:cid/posts', function(req, res){
    var cid = req.params.cid;
    getChannelById(res, cid)
    .then(addPostToChannel.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

});

app.get('/channels/:cid/posts/:pid', function(req, res){
    var cid = req.params.cid;
    var pid = req.params.pid;

    getChannelById(res, cid)
    .then(getPostFromChannelById.bind(null, res, pid), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

});

app.put('/channels/:cid/posts/:pid', function(req, res){
    var cid = req.params.cid;
    var pid = req.params.pid;
    var newPost = req.body;

    getChannelById(res, cid)
    .then(putPostFromChannelById.bind(null, res, pid, newPost), failChain)
    .then(putChannel.bind(null, res, cid), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));


});

app.delete('/channels/:cid/posts/:pid', function(req, res){
    var cid = req.params.cid;
    var pid = req.params.pid;

     getChannelById(res, cid)
    .then(delPostFromChannelById.bind(null, res, pid), failChain)
    .then(putChannel.bind(null, res, cid), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

});

app.listen(8080, function(){
    console.log("Listening on port 8080");
});

function getChannels(res){
    var deferred = q.defer();
    var options = {
        host: 'localhost', port: 8081, path: '/blobs', method: 'GET'
    };
    http.request(options, function(response){
        var data = '';
        response.on('data', function(chunk){
            data += chunk;
        });
        response.on('end', function(){
            if(response.statusCode == 200){
                data = JSON.parse(data);
                deferred.resolve(data);
            } else {
                res.status(500);
                deferred.reject("Cannot get channels");
            }
        });

    })
    .on('error', function(err){
        // console.log(err);
        res.status(500);
        deferred.reject("Error when requesting from storage: " + err.code);
    })  
    .end();

    return deferred.promise;
}

function postChannel(req, res, channel){
    var deferred = q.defer();
    channel['posts'] = [];
    channel['nextPostId'] = 0;
    channel = JSON.stringify(channel);
    var options = {
        host: 'localhost', 
        port: 8081, 
        path: '/blobs', 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(channel)
        }
    };

    http.request(options, function(response){
        var data = '';
        response.on('data', function(chunk){
            data += chunk;
        });
        response.on('end', function(){
            if(response.statusCode == 201){
                // console.log("New Channel Id: " + data.toString())
                deferred.resolve(data.toString());
            } else {
                // console.log(res);
                res.status(500);
                deferred.reject("Cannot post channel.");
            }
        });

    })
    .on('error', function(err){
        // console.log(err);
        res.status(500);
        deferred.reject("Error when requesting from storage: " + err.code);
    })  
    .end(channel);

        return deferred.promise;
}

function putChannel(res, cid, channel){
    var deferred = q.defer();
    channel = JSON.stringify(channel);

    var options = {
        host: 'localhost',
        port: 8081, 
        path: '/blobs/' + cid, 
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(channel)
        }
    };
    http.request(options, function(response){
        var data = '';
        response.on('data', function(chunk){
            data += chunk;
        });
        response.on('end', function(){
            if(response.statusCode == 200){
                deferred.resolve(data.toString());
            } else if( response.statusCode == 404){
                res.status(404);
                deferred.reject("No channel with id: " + cid);
            } else {
                res.status(500);
                deferred.reject("Cannot put channel: " + cid);
            }
                
        });
    })
    .on('error', function(err){
        // console.log(err);
        res.status(500);
        deferred.reject("Error when requesting from storage: " + err.code);
    })  
    .end(channel);
    return deferred.promise;
}

function addPostToChannel(req, res, channel){
    // console.log("Updating channel");
    var deferred = q.defer();
    var newPost = req.body;
    newPost['id'] = channel['nextPostId'];
    channel['nextPostId'] = channel['nextPostId'] + 1;
    channel['posts'].push(newPost);

    // console.log("Putting Channel");
    // console.log(channel);

    channel = JSON.stringify(channel);
    var cid = req.params.cid;

    var options = {
        host: 'localhost',
        port: 8081, 
        path: '/blobs/' + cid, 
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(channel)
        }
    };
    http.request(options, function(response){
        var data = '';
        response.on('data', function(chunk){
            data += chunk;
        });
        response.on('end', function(){
            if(response.statusCode == 200){
                // console.log(newPost['id']);
                deferred.resolve(newPost['id'].toString());
            } else {
                res.status(500);
                deferred.reject("Could not add post to channel with id: " + cid);
            }
                
        });
    })
    .on('error', function(err){
        // console.log(err);
        res.status(500);
        deferred.reject("Error when requesting from storage: " + err.code);
    })  
    .end(channel);

    return deferred.promise;
}

function getChannelById(res, cid){
    var deferred = q.defer();

    var options = {
        host: 'localhost', port: 8081, path: '/blobs/' + cid , method: 'GET'
    };
    http.request(options, function(response){
        var data = '';
        response.on('data', function(chunk){
            data += chunk;
        });
        response.on('end', function(){
            if(response.statusCode == 200){
                //If successful 
                data = JSON.parse(data);
                deferred.resolve(data);
            } else if(response.statusCode == 404) {
                //If error occured
                res.status(404);
                deferred.reject("No channel with id: " + cid);
            } else {
                res.status(500);
                deferred.reject("Could not get channel with id: " + cid);
            }
        });
    })
    .on('error', function(err){
        //console.log(err);
        res.status(500);
        deferred.reject("Error when requesting from storage: " + err.code);
    })
    .end();

    return deferred.promise;
}

function deleteChannelById(res, cid){
    var deferred = q.defer();
    var options = {
        host: 'localhost', port: 8081, path: '/blobs/' + cid , method: 'DELETE'
    };
    http.request(options, function(response){
        var data = '';
        response.on('data', function(chunk){
            data += chunk;
        });
        response.on('end', function(){
            if(response.statusCode == 200){
                //console.log(data);
                deferred.resolve(data);
            } else if(response.statusCode == 404) {
                res.status(404);
                deferred.reject("No channel with id: " + cid);
            } else {
                res.status(500);
                deferred.reject("Could not delete channel with id: " + cid);
            }
        });
    })
    .on('error', function(err){
        //console.log(err);
        res.status(500);
        deferred.reject("Error when requesting from storage: " + err.code);
    })  
    .end();

    return deferred.promise;
}

function getPostFromChannelById(res, pid, channel){
    var deferred = q.defer();
    //console.log(channel);
    var posts = channel['posts'];
    var foundPost = false;
    posts.forEach(function(post) {
        if(post['id'] == pid){
            foundPost = true;
            deferred.resolve(post);
        }
    });
    if(!foundPost){
        res.status(404);
        deferred.reject("No post with id: " + pid);
    }
    return deferred.promise;
}

function putPostFromChannelById(res, pid, newPost, channel){
    var deferred = q.defer();
    //console.log(channel);
    var posts = channel['posts'];
    var foundPost = false;
    for(i=0; i<posts.length; i++){
        if(posts[i]['id'] == pid){
            foundPost = true;
            newPost['id'] = parseInt(pid);
            posts[i] = newPost;
            channel['posts'] = posts;
            deferred.resolve(channel);
        }

    }
    if(!foundPost){
        res.status(404);
        deferred.reject("No post with id: " + pid);
    }
    return deferred.promise;   
}

function delPostFromChannelById(res, pid, channel){
    var deferred = q.defer();
    var postFound = false
    for(i=0; i< channel['posts'].length; i++){
        if(channel['posts'][i]['id'] == pid){
            channel['posts'].splice(i, 1);
            postFound = true;
        }
    }
    if(postFound){
        deferred.resolve(channel);
    } else {
        res.status(404);
        deferred.reject("No post with id: " + pid);
    }
    return deferred.promise;
}

function sendResponseSuccess(res, data){
    console.log();
    console.log("Successful: " + res.statusCode);
    console.log("Sending:");
    console.log(data);
    res.send(data);
}

function sendResponseFailure(res, err){
    console.log();
    console.log("Failure: " + res.statusCode);
    console.log("Sending:");
    console.log(err);
    res.send(err);
}

function failChain(err){
    return q.Promise.reject(err);
}