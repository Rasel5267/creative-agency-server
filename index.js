const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileUpload");
const MongoClient = require("mongodb").MongoClient;
// const ObjectId = require("mongodb").ObjectId;
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('icons'));
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
    const newProject = req.body;
    userCollection.insertOne(newProject)
    .then(result => {
      res.send(result.insertedCount > 0);
    })
  })

  app.get("/project", (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
          let tokenEmail = decodedToken.email;
          console.log(tokenEmail, req.query.email);
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

  app.post('/addNewService', (req, res) =>{
    const newService = req.body;
    service.insertOne(newService)
      .then(result => {
          res.send(result.insertedCount > 0);
    })
  })
  app.get("/newService", (req, res) =>{
    service.find({})
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

});



app.listen(process.env.PORT || port);