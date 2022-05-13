const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://db_doctor:<password>@cluster0.guz4u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

app.get('/', (req, res) => {
  res.send('Hello Doctor on UI')
})

app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`)
})