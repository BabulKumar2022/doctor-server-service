const express = require('express');
const cors = require('cors');
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



async function run(){
    try{
        await client.connect();
        const treatmentCollection = client.db('doctor_service').collection('treatment');
        const bookingCollection = client.db('doctor_service').collection(' booking');
       
        console.log('db connected');



        //data get from collection of mongodb for modal input field
        app.get('/service', async(req, res) =>{
            const query ={};
            const cursor = treatmentCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
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
* app.patch('/booking/:id') // update a specific booking
* app.delete('/booking/id') // delete a specific booking
*/

//get patient from booking collection 
app.get('/booking', async(req, res) =>{
  const patient =req.query.patient;
  const query = {patient: patient};
  const bookings = await bookingCollection.find(query).toArray();
  res.send(bookings);
  console.log(bookings);

})

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