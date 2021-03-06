const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs-extra");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('serviceIcon'));
app.use(fileUpload());
const port = 5000;



var serviceAccount = require("./config/creative-agency-bd-firebase-adminsdk-eftks-d94621c441.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://creative-agency-bd.firebaseio.com"
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zsf87.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.get('/', (req, res) => {
    console.log('hello i am working');
    res.send('hello')
})




const client = new MongoClient(uri, { 
  useNewUrlParser: true,
  useUnifiedTopology: true 
});
client.connect(err => {
  const userCollection = client.db("creative-agency").collection("manage-user-data");
  const userReview = client.db("creative-agency").collection("review");
  const service = client.db("creative-agency").collection("manage-admin-data");
  const adminCollection = client.db("creative-agency").collection("admin");

  app.post("/addProject", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const projectDtl = req.body.projectDtl;
    const name = req.body.name;
    const email = req.body.email;
    
    console.log(file.data);

      const newUploadImg = file.data;
      const encImage = newUploadImg.toString('base64');

        var newImage = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImage, 'base64')
        };

        userCollection.insertOne({title, projectDtl, name, email, newImage })
      .then(result =>{
          res.send(result.insertedCount > 0)
      })
  })

  app.get("/project", (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
          let tokenEmail = decodedToken.email;
          if(tokenEmail === req.query.email){
            userCollection.find({email: req.query.email})
            .toArray((err, documents) => {
              res.send(documents)
            })
          }
          
        }).catch(function(error) {
          // Handle error
        });
    }
  })

  app.post("/addReview", (req, res) => {
    const newReview = req.body;
    userReview.insertOne(newReview)
    .then(result => {
      res.send(result.insertedCount > 0);
    })
  })

  app.get("/addNewReview", (req, res) =>{
    userReview.find({})
    .toArray( (err, documents) => {
      res.send(documents);
    })
  })
  
  app.get("/allProject", (req, res) =>{
    userCollection.find({})
    .toArray( (err, documents) => {
      res.send(documents);
    })
  })

  app.post("/addAAdmin", (req, res) => {
    const newAdmin = req.body;
    adminCollection.insertOne(newAdmin)
    .then(result => {
      res.send(result.insertedCount > 0);
    })
  })

  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email})
      .toArray((err, documents) => {
        res.send(documents.length > 0 )
      })
  })

  app.post('/addNewService', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;

      const newImg = file.data;
      const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

      service.insertOne({title, description, image })
      .then(result =>{
          res.send(result.insertedCount > 0)
      })
  })

  app.get("/newService", (req, res) =>{
    service.find({})
    .toArray( (err, documents) => {
      res.send(documents);
    })
  })


});



app.listen(process.env.PORT || port);