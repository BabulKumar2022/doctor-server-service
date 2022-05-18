const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.guz4u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//JWT verify function
function verifyJWT(req, res, next){
  // console.log('abcd')
  const authHeader = req.headers.authorization;
  if(! authHeader){
    return res.status(401).send({message: 'UnAuthorized access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(403).send({message: 'Forbidden access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run(){
    try{
        await client.connect();
        const treatmentCollection = client.db('doctor_service').collection('treatment');
        const bookingCollection = client.db('doctor_service').collection(' booking');
        const userCollection = client.db('doctor_service').collection('users');
        const doctorCollection = client.db('doctor_service').collection('doctors');
       
        console.log('db connected');



        //data get from collection of mongodb for modal input field
        app.get('/service', async(req, res) =>{
            const query ={};
            const cursor = treatmentCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        // get all user
        app.get('/user', async(req, res) =>{
          const users = await userCollection.find().toArray();
          res.send(users);
        });


        //  insert for admin
        app.put('/user/admin/:email', verifyJWT,async(req, res) =>{
          const email = req.params.email;
          const requester = req.decoded.email;
          const requesterAccount = await userCollection.findOne({email: requester});
          if(requesterAccount.role === 'admin'){
            const filter = {email: email};
            const updateDoc = {
              $set: {role: 'admin'},
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
          }else{
            res.status(403).send({message: 'Forbidden'})
          }

        });

        app.get('/admin/:email', async(req, res) =>{
          const email = req.params.email;
          const user = await userCollection.findOne({email: email});
          const isAdmin = user.role === 'admin';
          res.send({admin: isAdmin})
        })

        // UPSERT(update or insert)
        app.put('/user/:email', async(req, res) =>{
          const email = req.params.email;
          const user = req.body;
          const filter = {email: email};
          const options ={upsert: true};
          const updateDoc = {
            $set: user,
          };
          const result = await userCollection.updateOne(filter, updateDoc, options);
          const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET,{expiresIn: '20h'})
          res.send({result, token});
        })


        app.get('/available', async(req, res) =>{
          const date = req.query.date;

          // step 1: get all services
          const services = await treatmentCollection.find().toArray();
         
          // step 2: get the booking of that day
          const query = {date: date};
          const bookings = await bookingCollection.find(query).toArray();
          
          // step 3: For each service, find booking for that service
            services.forEach(service =>{
              const serviceBookings = bookings.filter(b => b.treatment === service.name);
              const bookedSlots = serviceBookings.map(s=> s.slot);
              const available = service.slots.filter(s=> !bookedSlots.includes(s));
              service.slots = available;

            })

          res.send(services);
        })

/*
* API Naming convention
* app.get('/booking') // get all booking in this collection. or  get  more than one or by filter
* app.get('/booking/:id') // get a specific booking
* app.post('/booking') // add a new booking
*app.put('/booking/:id')// upsert ==> update(if exists)  or insert (if doesn't exists)
* app.patch('/booking/:id') // update a specific booking
* app.delete('/booking/id') // delete a specific booking
*/

//get patient from booking collection 
app.get('/booking', verifyJWT, async(req, res) =>{
  const patient =req.query.patient;
  //token secured
  const authorization = req.headers.authorization;
  // console.log('auth header', authorization);
  const decodedEmail = req.decoded.email;
  if(patient === decodedEmail){
    const query = {patient: patient};
    const bookings = await bookingCollection.find(query).toArray();
    res.send(bookings);
    // console.log(bookings);
  }else{
    return res.status(403).send({message: 'forbidden access'})
  }
})

// doctor collection
app.post('/doctor', async(req, res) =>{
  const doctor =req.body;
  const result = await doctorCollection.insertOne(doctor);
  res.send(result);
});


// data get from UI(modal) and post to mongodb collection booking
app.post('/booking', async(req, res) =>{
  const booking = req.body;
  const query = {treatment: booking.treatment, date: booking.date, patient: booking.patient};
  const exists = await bookingCollection.findOne(query);
  if(exists){
    return res.send({success: false, booking: exists})
  }
  const result = await bookingCollection.insertOne(booking);
   return res.send({success: true, result});
})

    }
    finally{

    }

}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Doctor on UI')
})

app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`)
})