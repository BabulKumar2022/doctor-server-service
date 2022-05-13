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
        console.log('db connected');
        app.get('/service', async(req, res) =>{
            const query ={};
            const cursor = treatmentCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
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