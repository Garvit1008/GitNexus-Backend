require('dotenv').config();
const express = require('express');
const app = express();
// const axios = require('axios');
const bodyParser = require('body-parser');
const userRoute = require('./routes/user');
const PORT = process.env.PORT||3000
const mongoose = require('mongoose');
const session = require('express-session');
mongoose.connect(process.env.MONGO_URL
).then(()=>{
  console.log("database connected...")
})
.catch(()=>{
  console.log("error connecting database");
})

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}))

app.use(express.json());
app.use(bodyParser.json());
app.use('/',userRoute);
app.listen(PORT,()=>{
    console.log("server running at port"+PORT);
})  