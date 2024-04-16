const user = require('../models/user');
const jwt = require('jsonwebtoken');
const { userValidateSignUp, userValidateLogin } = require('../types');
const axios = require('axios');
const session = require("express-session")
const bcrypt = require('bcrypt');
const express = require("express")
const router = express.Router();
router.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))
const signUp = async (req,res)=>{
    try{
        const{username,email,password} = req.body;
        const ValidateSignUp = userValidateSignUp.safeParse({username,email,password});
        if (!ValidateSignUp.success) {
            const errorMessage = ValidateSignUp.error.errors.map((error) => {
                
                return error.path ? `${error.path[0]} ${error.message}` : error.message;
            }).join(', ');
            return res.status(400).json({ msg: errorMessage });
    }
    else{
        const userName= await user.findOne({username});
        if(userName){
            return res.status(400).json({msg:"Username already Exists"});
        }
        const userInfo = await user.findOne({email});
        if(userInfo){
            return res.status(400).json({msg:"Email already registered"});
        }
        const hashPassword = await bcrypt.hash(password,10);
        const userData = await user.create({
            username,
            email,
            password:hashPassword
        })
        return res.status(200).json({
            msg:"Account created successfully",
            data:{userData}
        })
    }
}
    catch(err){
        console.log(err);
    }
}
const   login = async (req,res)=>{
    try{
        const{email,password} = req.body;
        const validateLogin = userValidateLogin.safeParse({email,password});
        if(!validateLogin.success){
            const errorMessage = validateLogin.error.errors.map((error) => {
                return error.path ? `${error.path[0]} ${error.message}` : error.message;
            }).join(', ');
            return res.status(400).json({ msg: errorMessage });
        }
        const userInfo = await user.findOne({email});
        console.log(userInfo.email)
        if(!userInfo){
            return res.status(400).json({
                msg:"email not found"
            })
        }
        else if(!bcrypt.compareSync(password,userInfo.password)){
            return res.status(400).json({
                msg:"Wrong password"
            })
        }
        else{
            userInfo.password = undefined;
            const token = getToken(userInfo)
            req.session.loggin = userInfo
            return res.status(200).json({
                msg:"Login Successfully",
                userInfo,
                token,
            })
        }
    }
    catch(err){
        res.status(500).json({
            msg:err
        })
    }
}
const gettingCard = async (req, res) => {   
    try {
        const username = req.params.username;
        const token = getToken(req.user);

        const response = await axios.get(`https://api.github.com/users/${username}`, {
            headers: {
                Authorization: `token ${token}`
            }
        });

        const user = response.data;

       
        if (!user) {
            return res.status(404).json({ message: 'User not found or has no repositories.' });
        }

        // Handling user with null name
        if (user.name === null) {
            user.name = 'GitHub';
        }
        
        const userData = {
            avatar_url: user.avatar_url,
            login: user.login,
            name: user.name,
            html_url: user.html_url
        };

        res.send(userData);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
};
const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const allUsers = async (req, res) => {
    try {
        
        const startUserId = getRandomNumber(20, 60);
        const response = await axios.get('https://api.github.com/users', {
            params: {
                since: startUserId
            }
        });
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
    const getToken = (user)=>{
        const userdata = {username:user.username,email:user.email};
        const expireTime = 60*60*24
        const token = jwt.sign(userdata,process.env.JWT_SECRET,{expiresIn:expireTime})
        return {token,expireTime}
    }

    const searchUsers = async (req, res) => {
        try {   
            const { username } = req.params;
            const response = await axios.get('https://api.github.com/search/users', {
                params: {
                    q: `type:user ${username} in:login`, 
                    per_page: 40
                }
            });
    
        
            const users = response.data.items.map(user => ({
                login: user.login,
                avatar_url: user.avatar_url,
                html_url: user.html_url
            }));
    
          
            res.status(200).json(users);
        } catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
    const repositoryTable = async (req, res) => {
        try {
            const username = req.params.username; // Assuming username is passed as a parameter in the request
            const response = await axios.get(`https://api.github.com/users/${username}/repos`);
            
            let repositories = response.data.map(repo => ({
                name: repo.name,
                description: repo.description || "No Description",
                stars: repo.stargazers_count,
                forks: repo.forks,
                open_issues: repo.open_issues
            }));
    
            // Check if sortBy is provided in the request body
            if (req.body && req.body.sortBy === "name") {
                console.log("Sorting repositories by name...");
                repositories.sort((a, b) => a.name.localeCompare(b.name));
            } else {
                console.log("No sorting criteria provided or sorting by name is not requested.");
            }
            
            // Now you can send this repository data to the client or render it in your desired format
            res.json(repositories);
        } catch (error) {
            console.error('Error fetching repositories:', error);
            res.status(500).json({ error: 'Error fetching repositories' });
        }
    };
    

    const searchFilter = async(req,res)=>{

    }
    const logout = (req, res) => {
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).json({ message: 'Internal server error' });
            } else {
                // Session destroyed successfully
                res.status(200).json({ message: 'Logged out successfully' });
            }
        });
    };
    
    module.exports = {signUp,gettingCard,allUsers,login,searchUsers,logout,repositoryTable};