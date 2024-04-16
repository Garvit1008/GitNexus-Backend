const mongoose = require('mongoose');
const userSchema  = new mongoose.Schema({
    username:{
        required:true,
        trim:true,
        type:String
    },
    email:{
        required:true,
        trim:true,
        type:String  
    },
    password:{
        required:true,
        trim:true,
        type:String
    }
})
module.exports = mongoose.model('user',userSchema);