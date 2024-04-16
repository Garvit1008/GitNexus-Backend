const express = require('express');
const router = express.Router();
const user = require('../controller/user')
const { verifyToken } = require('../middleware/verifyToken');
router.get('/users',user.allUsers)
router.get('/users/:username',user.gettingCard)
router.post('/userSignUp',user.signUp)
router.post("/userLogin",user.login)           
router.post('/userLogOut',user.logout)
router.get('/getUsers/:username', user.searchUsers)     
router.get('/getUsers/:username/repositories',user.repositoryTable)  
router.get('/getusers/:username/:reponame',user.listContributors)                                                                                                            
module.exports =router