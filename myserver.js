var http = require("http"); // Requires the built-in http module
var mustache = require("mustache");
var express = require('express'); //requires the Express module
var path = require('path');
const fs = require('fs');


const cors = require("cors");
const app = express();

app.use(cors());


//Mongo DB connection 

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);
let dbPprefix = properties.get("db.prefix");
//URL-Encoding of User and PWD
//for potential special characters
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");
const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);



app.use(express.json());

//a static file middleware that returns lesson images, or an error message if the image file does not exist
app.use(function (req, res, next) {
        console.log("Request IP: " + req.url);
        console.log("Request date: " + new Date());
        next();
});
app.use('/img',function (req, res, next) {
        var filePath = path.join(__dirname,'..',"CW2-frontend","img", req.url);
        fs.stat(filePath, function (err, fileInfo) {
                if (err) {
                        next();
                        return;
                }
                if (fileInfo.isFile()) {
                        res.sendFile(filePath);
                } else {
                        next();
                }
        });
});

app.param('lessons', function (req, res, next, lessons) {
        req.collection = db.collection(lessons);
        return next();

});

app.get("/", function(req,res) {
         res.send('Select a collection.e.g- /collections/lessons or collections/orders ');
});

app.get('/collections/:lessons', function (req, res, next) {
        req.collection.find({}).toArray(function (err, results) {
                if (err) {
                        return next(err);
                }
                res.send(results);
        });
});

//one POST route that saves a new order to the “order” collection
app.post('/collections/:lessons', function (req, res, next) {
        // TODO: Validate req.body
        const order= req.body;
        console.log(order.info[0].basketInfo);
        req.collection.insertOne(order, function (err, results) {
                if (err) {
                        return next(err);
                }
                 res.send(results);
        });
        
});

//DELETE AND Deleting Documents

app.delete('/collections/:lessons/:id' , function (req, res, next) {
                req.collection.deleteOne(
                        {_id: new ObjectId(req.params.id) }, function (err, result) {
                                if (err) {
                                        return next(err);
                                } else {
                                        res.send((result.deletedCount === 1) ? { msg: "success" } : { msg: "error" });
                                }
                        }
                );
        });

//PUT REQUEST
//STORE THE INFOMATION THAT CAME FROM THE PUT REQUEST (URL) and STORED IN SPACES ARRAY 
app.put('/collections/:lessons' , function (req, res, next) {
                // TODO: Validate req.body
                const spaces = req.body;
                console.log(spaces);
                
                for(var i=0; i < spaces.availability.length; i++){

                  req.collection.updateMany({ id: spaces.availability[i].id },
                         { $set: {availableInventory: spaces.availability[i].spaces} },
                         function (err, result) {
                                if (err) {
                                        return next(err);
                                } 
                        }
                  );

                }
                
                 res.send({ msg: "success" });
                    

        });


        

// A “logger” middleware that outputs all requests to the server console
app.use((request, response, next) => {
        console.log('Output request...');
        next();
});

app.set('json spaces', 5);

// //Lessons routing 
// app.get('/lessons', function (request, response) {

//         let lessons = [
//                 {
//                         id: 1000,
//                         subject: "English",
//                         location: "London",
//                         price: "100",
//                         newImg: 'img/english.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1001,
//                         subject: "Maths",
//                         location: "France",
//                         price: "200",
//                         newImg: 'img/maths.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1002,
//                         subject: "Science",
//                         location: "France",
//                         price: "150",
//                         newImg: 'img/science1.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1003,
//                         subject: "Art",
//                         location: "London",
//                         price: "50",
//                         newImg: 'img/art.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1004,
//                         subject: "Music",
//                         location: "France",
//                         price: "80",
//                         newImg: 'img/music.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1005,
//                         subject: "History",
//                         location: "London",
//                         price: "50",
//                         newImg: 'img/history.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1006,
//                         subject: "Geography",
//                         location: "France",
//                         price: "150",
//                         newImg: 'img/geography.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1007,
//                         subject: "Computer Science",
//                         location: "Germany",
//                         price: "150",
//                         newImg: 'img/cs.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1008,
//                         subject: "English",
//                         location: "New York",
//                         price: "150",
//                         newImg: 'img/english.jpg',
//                         availableInventory: 10

//                 },
//                 {
//                         id: 1009,
//                         subject: "Science",
//                         location: "London",
//                         price: "150",
//                         newImg: 'img/science1.jpg',
//                         availableInventory: 10

//                 }
//         ];

//         response.json(lessons);


// });


//Error Handler
app.use((request, response) => {
        response.status(404).send('Resource not found ');
});

//An error message if the image file does not exist
app.use(function (req, res) {
        res.status(404);
        res.send("File not found!");
});

// Starting the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
        console.log(`App started on port:${port}`);
});
