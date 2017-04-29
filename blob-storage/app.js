var redis = require('redis');
var client = redis.createClient();
var app = require('express')();
var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies

app.param('id', function(req, res, next){
    console.log("verifying id param");
    if(Number.isInteger(parseInt(req.params.id))){
        console.log("Id is integer");
        req.id = req.params.id;
        next();
    } else {
        console.log("id is not integer");
        res.status(200).send("Invalid id");
    }
});

app.get('/blobs', function(req, res){
    console.log("GET /blobs");
    client.scan(0, "match", "blobs:*", function(err, reply){
        console.log(reply[1].length);
        var ids = [];
        for(i=0; i<reply[1].length; i++){
            var id = reply[1][i].slice(6)
            console.log(id);
            ids.push(id);
        }
        res.send(ids);
    });
});

app.post('/blobs', function(req, res){
    console.log("POST /blobs");
    console.log(req.body);
    //incr id field
    client.incr("idCount", function(err, incr_reply){
        var id = incr_reply;
        var blobKey = "blobs:" + id;
        console.log("Stored at " + blobKey);
        var newBlob = req.body;
        newBlob["id"] = id;
        client.set(blobKey, JSON.stringify(newBlob), function(err, reply){
            console.log(reply);
            res.status(201).send(id.toString());
        });
    });
});

app.get('/blobs/:id', function(req, res){
    console.log("GET /blobs/:id");
    var id = req.id;
    var blobKey = "blobs:" + id; 
    client.get(blobKey, function(err, reply){
        if(reply){
            var blob = JSON.parse(reply);
            res.send(blob);
        } else {
            res.status(404);
            res.send("No blob with id: " + id);
        }

    });
});

app.put('/blobs/:id', function(req, res){
    console.log("PUT /blobs/:id");
    var id = req.id
    var blobKey = "blobs:" + id;
    var newBlob = req.body;
    newBlob["id"] = id;
    client.exists(blobKey, function(err, ex_reply){
        console.log(ex_reply);
        if(ex_reply == 1){
            client.set(blobKey, JSON.stringify(newBlob), function(err, reply){
                console.log(reply);
                res.sendStatus(200);
            });
        } else {
            res.status(404);
            res.send("No blob with id: " + id);
        }
    });

    
});

app.delete('/blobs/:id', function(req, res){
    console.log("DELETE /blobs/:id");
    var id = req.id
    var blobKey = "blobs:" + id; 
    client.del(blobKey, function(err, reply){
        if(reply){
            console.log("Blob " + id + "deleted.");
            res.sendStatus(200);
        } else {
            res.status(404);
            res.send("No blob with id: " + id);
        }
    });
});

app.listen(8081, function(){
    console.log("Running on port 8081");
});

function printRedis(err, reply){
    console.log("err: " + err);
    console.log("reply:" + reply);
};