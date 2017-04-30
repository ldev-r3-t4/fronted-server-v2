var app = require('express')();
var q = require('q');
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser');
app.use(bodyParser.json());    
var morgan = require('morgan');
app.use(morgan('tiny'));

var storage_url = "ec2-54-69-164-246.us-west-2.compute.amazonaws.com";
var storage_port = 8000;

app.get('/channels', function(req, res){
    console.log('get channel');
    getStorage(res)
    .then(getChannels.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

    // getChannels(res)
    // .then(sendResponseSuccess.bind(null, res),
    //       sendResponseFailure.bind(null, res));
});

app.post('/channels', function(req, res){
    console.log('post channel');
    getStorage(res)
    .then(postChannel.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

    // channel = req.body;
    // postChannel(req, res, channel)
    // .then(sendResponseSuccess.bind(null, res),
    //       sendResponseFailure.bind(null, res));
});

app.get('/channels/:cid', function(req, res){
    var cid = req.params.cid;

    getStorage(res)
    .then(getChannelById.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

    // getChannelById(res, cid)
    // .then(sendResponseSuccess.bind(null, res),
    //       sendResponseFailure.bind(null, res));

});

app.delete('/channels/:cid', function(req, res){
    getStorage(res)
    .then(deleteChannelById.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

    // deleteChannelById(res, cid)
    // .then(sendResponseSuccess.bind(null, res),
    //       sendResponseFailure.bind(null, res));
});

app.post('/channels/:cid/posts', function(req, res){
    getStorage(res)
    .then(addPostToChannel.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));

});

app.get('/channels/:cid/posts/:pid', function(req, res){
     getStorage(res)
    .then(getPostFromChannelById.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));
});

app.put('/channels/:cid/posts/:pid', function(req, res){
    getStorage(res)
    .then(putPostFromChannelById.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));
});

app.delete('/channels/:cid/posts/:pid', function(req, res){
    getStorage(res)
    .then(delPostFromChannelById.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));
});

app.get('/test', (req, res) => {
    console.log('test path');
    getStorage(res)
    // .then(postChannelToStorage.bind(null, req, res), failChain)
    .then(sendResponseSuccess.bind(null, res),
          sendResponseFailure.bind(null, res));
});


app.listen(8080, function(){
    console.log("Listening on port 8080");
});

function getStorage(res){
    console.log("getStorage called");
    var deferred = q.defer();
    var storage_path = ('/v1/primary');
    var option_url = 'http://' + storage_url + ':' + storage_port + storage_path + '/';
    console.log(option_url);
    var options = {
        url: option_url,
        method: "GET"
    
    };
    request(options, function(error, response, body) {
        // console.log("BODY");
        // console.log(body);
        if(error){
            res.status(500);
            deferred.reject("Error when requesting from storage: " + error.code);
        } else if(response.statusCode == 200){
            deferred.resolve(JSON.parse(body));
        } else {
            res.status(500);
            deferred.reject("Cannot get storage body");
        }
    });



    // http.request(options, function(response){
    //     var data = '';
    //     response.on('data', function(chunk){
    //         data += chunk;
    //     });
    //     response.on('end', function(){
    //         if(response.statusCode == 200){
    //             data = JSON.parse(data);
    //             console.log(data);
    //             deferred.resolve(data);
    //         } else {
    //             res.status(500);
    //             deferred.reject("Cannot get storage body");
    //         }
    //     });

    // })
    // .on('error', function(err){
    //     console.log(err);
    //     res.status(500);
    //     deferred.reject("Error when requesting from storage: " + err.code);
    // })  
    // .end();

    return deferred.promise;
}

function postChannel(req, res, storage_response){
    console.log("postChannel called");
    var deferred = q.defer();
    var newChannel = req.body;
    var newId = 0;
    var newChannels = [];
    if(storage_response.body != null){
        if("idCount" in storage_response.body){
            newId = storage_response.body.idCount + 1;
        } 
        if("channels" in storage_response.body){
            newChannels = storage_response.body.channels;
        }
    }
    newChannel['id'] = newId;
    newChannel['posts'] = [];
    newChannel['nextPostId'] = 0;
    // newChannel = JSON.stringify(newChannel);
    newChannels.push(newChannel)
    
    var version = storage_response.version.toString();
    if(version != 0){
        version++;
    }
    var storage_path = ('/v1/primary/ver=') + version;
    var option_url = 'http://' + storage_url + ':' + storage_port + storage_path + '/';
    console.log(option_url);
    var newBody = {
        idCount: newId,
        channels: newChannels
    };
    console.log("Posting newBody");
    console.log(newBody);
    var options = {
        url: option_url,
        method: "POST",
        json: true,   
        body: newBody
    
    };
    request(options, function(error, response, body) {
        // console.log("BODY");
        // console.log(body);
        // console.log("RESPONSE");
        // console.log(response);
        if(error){
            res.status(500);
            deferred.reject("Error when requesting from storage: " + error.code);
        } else if(response.statusCode == 200){
            res.status(200);
            deferred.resolve(newId.toString());
            // deferred.resolve(body);
        } else {
            console.log(body);
            res.status(500);
            deferred.reject("Cannot post channel.");
        }
    });

    return deferred.promise;
};

function getChannels(req, res, storage_response){
    console.log("getChannels");
    var deferred = q.defer();
    var channelIds = [];
    if(storage_response.body != null){
        if("channels" in storage_response.body){
            var channels = storage_response.body.channels;
            for(i=0; i<channels.length; i++){
                channelIds.push(channels[i].id);
            }
            deferred.resolve(channelIds);
        } else {
            deferred.resolve([]);
        }
    } else {
        deferred.resolve([]);
    }
    return deferred.promise;
}

function putChannel(req, res, newChannel) {
    console.log("putChannel called");
    var deferred = q.defer();
    var cid = req.params.cid;
    var channels = [];
    if(storage_response.body != null){
        if("channels" in storage_response.body){
            channels = storage_response.body.channels;
        }
    }
    for(i=0; i<channels.length; i++){
        if(channels[i].id == cid){
            channels[i] = newChannel;
        }
    }
    
    var version = storage_response.version.toString();
    if(version != 0){
        version++;
    }
    var storage_path = ('/v1/primary/ver=') + version;
    var option_url = 'http://' + storage_url + ':' + storage_port + storage_path + '/';
    console.log(option_url);
    var newBody = {
        idCount: newId,
        channels: channels
    };
    console.log("Posting newBody");
    console.log(newBody);
    var options = {
        url: option_url,
        method: "POST",
        json: true,   
        body: newBody
    
    };
    request(options, function(error, response, body) {
        // console.log("BODY");
        // console.log(body);
        // console.log("RESPONSE");
        // console.log(response);
        if(error){
            res.status(500);
            deferred.reject("Error when requesting from storage: " + error.code);
        } else if(response.statusCode == 200){
            deferred.resolve(body);
        } else {
            console.log(body);
            res.status(500);
            deferred.reject("Cannot post channel.");
        }
    });

    return deferred.promise;
};

function getChannelById(req, res, storage_response){
    console.log("getChannelById");
    var deferred = q.defer();
    var channelIds = [];
    if(storage_response.body != null){
        if("channels" in storage_response.body){
            var channels = storage_response.body.channels;
            var foundCid = false;
            for(i=0; i<channels.length; i++){
                if(channels[i].id == req.params.cid) {
                    foundCid = true;
                    console.log(channels[i].id);
                    console.log(channels[i]);
                    res.status(200);
                    deferred.resolve(channels[i]);
                }
            }
            if(!foundCid){
                res.status(404);
                deferred.reject("No channel with that id");
            }
        } else {
            res.status(500);
            deferred.reject("Could not find and channels");
        }
    } else {
        res.status(500);
        deferred.reject("Body in storage is null");
    }
    return deferred.promise;
};

function deleteChannelById(req, res, storage_response){
    console.log("deleteChannelById called");
    var deferred = q.defer();
    var cid = req.params.cid;
    var channels = [];
    var newId = 0;
    if(storage_response.body != null){
        if("channels" in storage_response.body){
            channels = storage_response.body.channels;
        }
        if("idCount" in storage_response.body){
            newId = storage_response.body.idCount;
        }
    }
    var foundId = false;
    for(i=0; i<channels.length; i++){
        if(channels[i].id == cid){
            channels.splice(i, 1);
            foundId = true;
        }
    }
    
    if(!foundId){
        res.status(400);
        deferred.reject("No channel with id: " + cid);
    } else {
        var version = storage_response.version.toString();
        if(version != 0){
            version++;
        }
        var storage_path = ('/v1/primary/ver=') + version;
        var option_url = 'http://' + storage_url + ':' + storage_port + storage_path + '/';
        console.log(option_url);
        console.log("AFTER");
        console.log(channels);
        var newBody = {
            idCount: newId,
            channels: channels
        };
        console.log("Posting newBody");
        console.log(newBody);
        var options = {
            url: option_url,
            method: "POST",
            json: true,   
            body: newBody
        
        };
        request(options, function(error, response, body) {
            if(error){
                res.status(500);
                deferred.reject("Error when requesting from storage: " + error.code);
            } else if(response.statusCode == 200){
                deferred.resolve(body);
            } else {
                console.log(body);
                res.status(500);
                deferred.reject("Cannot delete channel.");
            }
        });
    }
    return deferred.promise;
};

function addPostToChannel(req, res, storage_response){
    console.log("addPostToChannel called");
    var deferred = q.defer();
    var newPost = req.body;
    var cid = req.params.cid;
    var channels = [];
    var newId = 0;
    if(storage_response.body != null){
        if("channels" in storage_response.body){
            channels = storage_response.body.channels;
        }
        if("idCount" in storage_response.body){
            newId = storage_response.body.idCount;
        }
    }

    var foundId = false;
    for(i=0; i<channels.length; i++){
        if(channels[i].id == cid){
            newPost['id'] = channels[i]['nextPostId'];
            channels[i]['nextPostId'] = channels[i]['nextPostId'] + 1;
            channels[i]['posts'].push(newPost);
            foundId = true;
        }
    }

    if(!foundId){
        res.status(400);
        deferred.reject("No channel with id: " + cid);
    } else {
        var version = storage_response.version.toString();
        if(version != 0){
            version++;
        }
        var storage_path = ('/v1/primary/ver=') + version;
        var option_url = 'http://' + storage_url + ':' + storage_port + storage_path + '/';
        console.log(option_url);
        console.log("AFTER");
        console.log(channels);
        var newBody = {
            idCount: newId,
            channels: channels
        };
        console.log("Posting newBody");
        console.log(newBody);
        var options = {
            url: option_url,
            method: "POST",
            json: true,   
            body: newBody
        
        };
        request(options, function(error, response, body) {
            if(error){
                res.status(500);
                deferred.reject("Error when requesting from storage: " + error.code);
            } else if(response.statusCode == 200){
                deferred.resolve(newPost.id.toString());
            } else {
                console.log(body);
                res.status(500);
                deferred.reject("Cannot add post to channel.");
            }
        });
    }
    return deferred.promise;
}

function getPostFromChannelById(req, res, storage_response){
    console.log("getPostFromChannelById");
    var deferred = q.defer();
    var channelIds = [];
    var cid = req.params.cid;
    var pid = req.params.pid;
    if(storage_response.body != null){
        if("channels" in storage_response.body){
            var foundCid = false;
            var channels = storage_response.body.channels;
            for(i=0; i<channels.length; i++){
                if(channels[i].id == cid) {
                    var foundCid = true;
                    var foundPid = false;
                    var posts = channels[i].posts;
                    for(j=0; j<posts.length; j++){
                        if(posts[j].id == pid){
                            var foundPid = true;
                            res.status(200);
                            deferred.resolve(posts[j]);
                        }
                    }
                    if(!foundPid){
                        res.status(404);
                        deferred.reject("No post with that pid");
                    }
                }
            }
            if(!foundCid){
                res.status(404);
                deferred.reject("No channel with that cid");
            }
        } else {
            res.status(500);
            deferred.reject("Could not find and channels");
        }
    } else {
        res.status(500);
        deferred.reject("Body in storage is null");
    }
    return deferred.promise;
};

function putPostFromChannelById(req, res, storage_response){
    console.log("putPostFromChannelById called");
    var deferred = q.defer();
    var newPost = req.body;
    var cid = req.params.cid;
    var pid = req.params.pid;
    var channels = [];
    var newId = 0;
    if(storage_response.body != null){
        if("channels" in storage_response.body){
            channels = storage_response.body.channels;
        }
        if("idCount" in storage_response.body){
            newId = storage_response.body.idCount;
        }
    }

    var foundCid = false;
    var foundPid = false;
    for(i=0; i<channels.length; i++){
        if(channels[i].id == cid){
            foundCid = true;
            console.log('here');
            var posts = channels[i].posts;
            for(j=0; j<posts.length; j++){
                if(posts[j].id == pid){
            console.log('here2');
                    var foundPid = true;
                    temp_id = posts[j].id;
                    posts[j] = newPost;
                    posts[j].id = temp_id;
                    channels[i].posts = posts;
                }
            }
        }
    }

    if(!foundCid){
        res.status(400);
        deferred.reject("No channel with id: " + cid);
    } else if(!foundPid) {
        res.status(400);
        deferred.reject("No post with id: " + pid);
    } else {
        var version = storage_response.version.toString();
        if(version != 0){
            version++;
        }
        var storage_path = ('/v1/primary/ver=') + version;
        var option_url = 'http://' + storage_url + ':' + storage_port + storage_path + '/';
        console.log(option_url);
        console.log("AFTER");
        console.log(channels);
        var newBody = {
            idCount: newId,
            channels: channels
        };
        console.log("Posting newBody");
        console.log(newBody);
        var options = {
            url: option_url,
            method: "POST",
            json: true,   
            body: newBody
        
        };
        request(options, function(error, response, body) {
            if(error){
                res.status(500);
                deferred.reject("Error when requesting from storage: " + error.code);
            } else if(response.statusCode == 200){
                deferred.resolve(body);
            } else {
                console.log(body);
                res.status(500);
                deferred.reject("Cannot add post to channel.");
            }
        });
    }
    return deferred.promise;
}

function delPostFromChannelById(req, res, storage_response){
    console.log("delPostFromChannelById called");
    var deferred = q.defer();
    var newPost = req.body;
    var cid = req.params.cid;
    var pid = req.params.pid;
    var channels = [];
    var newId = 0;
    if(storage_response.body != null){
        if("channels" in storage_response.body){
            channels = storage_response.body.channels;
        }
        if("idCount" in storage_response.body){
            newId = storage_response.body.idCount;
        }
    }

    var foundCid = false;
    var foundPid = false;
    for(i=0; i<channels.length; i++){
        if(channels[i].id == cid){
            foundCid = true;
            var posts = channels[i].posts;
            for(j=0; j<posts.length; j++){
                if(posts[j].id == pid){
                    var foundPid = true;
                    posts.splice(j, 1);
                    channels[i].posts = posts;
                }
            }
        }
    }

    if(!foundCid){
        res.status(400);
        deferred.reject("No channel with id: " + cid);
    } else if(!foundPid) {
        res.status(400);
        deferred.reject("No post with id: " + pid);
    } else {
        var version = storage_response.version.toString();
        if(version != 0){
            version++;
        }
        var storage_path = ('/v1/primary/ver=') + version;
        var option_url = 'http://' + storage_url + ':' + storage_port + storage_path + '/';
        console.log(option_url);
        console.log("AFTER");
        console.log(channels);
        var newBody = {
            idCount: newId,
            channels: channels
        };
        console.log("Posting newBody");
        console.log(newBody);
        var options = {
            url: option_url,
            method: "POST",
            json: true,   
            body: newBody
        
        };
        request(options, function(error, response, body) {
            if(error){
                res.status(500);
                deferred.reject("Error when requesting from storage: " + error.code);
            } else if(response.statusCode == 200){
                deferred.resolve(body);
            } else {
                console.log(body);
                res.status(500);
                deferred.reject("Cannot add post to channel.");
            }
        });
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

/*
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
*/
/*
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
*/

// function putChannel(res, cid, channel){
//     var deferred = q.defer();
//     channel = JSON.stringify(channel);

//     var options = {
//         host: 'localhost',
//         port: 8081, 
//         path: '/blobs/' + cid, 
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json',
//             'Content-Length': Buffer.byteLength(channel)
//         }
//     };
//     http.request(options, function(response){
//         var data = '';
//         response.on('data', function(chunk){
//             data += chunk;
//         });
//         response.on('end', function(){
//             if(response.statusCode == 200){
//                 deferred.resolve(data.toString());
//             } else if( response.statusCode == 404){
//                 res.status(404);
//                 deferred.reject("No channel with id: " + cid);
//             } else {
//                 res.status(500);
//                 deferred.reject("Cannot put channel: " + cid);
//             }
                
//         });
//     })
//     .on('error', function(err){
//         // console.log(err);
//         res.status(500);
//         deferred.reject("Error when requesting from storage: " + err.code);
//     })  
//     .end(channel);
//     return deferred.promise;
// }


// function deleteChannelById(res, cid){
//     var deferred = q.defer();
//     var options = {
//         host: 'localhost', port: 8081, path: '/blobs/' + cid , method: 'DELETE'
//     };
//     http.request(options, function(response){
//         var data = '';
//         response.on('data', function(chunk){
//             data += chunk;
//         });
//         response.on('end', function(){
//             if(response.statusCode == 200){
//                 //console.log(data);
//                 deferred.resolve(data);
//             } else if(response.statusCode == 404) {
//                 res.status(404);
//                 deferred.reject("No channel with id: " + cid);
//             } else {
//                 res.status(500);
//                 deferred.reject("Could not delete channel with id: " + cid);
//             }
//         });
//     })
//     .on('error', function(err){
//         //console.log(err);
//         res.status(500);
//         deferred.reject("Error when requesting from storage: " + err.code);
//     })  
//     .end();

//     return deferred.promise;
// }


// function getPostFromChannelById(res, pid, channel){
//     var deferred = q.defer();
//     //console.log(channel);
//     var posts = channel['posts'];
//     var foundPost = false;
//     posts.forEach(function(post) {
//         if(post['id'] == pid){
//             foundPost = true;
//             deferred.resolve(post);
//         }
//     });
//     if(!foundPost){
//         res.status(404);
//         deferred.reject("No post with id: " + pid);
//     }
//     return deferred.promise;
// }


// function putPostFromChannelById(res, pid, newPost, channel){
//     var deferred = q.defer();
//     //console.log(channel);
//     var posts = channel['posts'];
//     var foundPost = false;
//     for(i=0; i<posts.length; i++){
//         if(posts[i]['id'] == pid){
//             foundPost = true;
//             newPost['id'] = parseInt(pid);
//             posts[i] = newPost;
//             channel['posts'] = posts;
//             deferred.resolve(channel);
//         }

//     }
//     if(!foundPost){
//         res.status(404);
//         deferred.reject("No post with id: " + pid);
//     }
//     return deferred.promise;   
// }


// function delPostFromChannelById(res, pid, channel){
//     var deferred = q.defer();
//     var postFound = false
//     for(i=0; i< channel['posts'].length; i++){
//         if(channel['posts'][i]['id'] == pid){
//             channel['posts'].splice(i, 1);
//             postFound = true;
//         }
//     }
//     if(postFound){
//         deferred.resolve(channel);
//     } else {
//         res.status(404);
//         deferred.reject("No post with id: " + pid);
//     }
//     return deferred.promise;
// }