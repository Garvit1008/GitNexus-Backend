require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
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
app.use(cors());
app.use(express.json());
app.use('/',userRoute);
app.listen(PORT,()=>{
    console.log("server running at port"+PORT);
})  