const express = require('express');
const router = express.Router();
const user = require('../controller/user')
const { verifyToken } = require('../middleware/verifyToken');
router.get('/users',user.allUsers)
router.post('/userSignUp',user.signUp)
router.post("/userLogin",user.login)           
router.post('/userLogOut',user.logout)
router.get('/getUsers/:username', user.searchUsers)     
router.get('/getUsers/:username/repositories',user.repositoryTable)                                                                                                            
// router.get('/users/:username',verifyToken,user.gettingCard)   
module.exports =router