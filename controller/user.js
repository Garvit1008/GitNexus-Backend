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

        const response = await axios.get(`https://api.github.com/users/${username}`);
        const user = response.data;
       
        if (!user) {
            return res.status(404).json({ message: 'User not found or has no repositories.' });
        }
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
                name: user.name || user.login, // Use user.login if user.name is not available
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
            res.json(repositories);
        } catch (error) {
            console.error('Error fetching repositories:', error);
            res.status(500).json({ error: 'Error fetching repositories' });
        }
    };
    const listContributors = async (req, res) => {
        try {
            const username = req.params.username;
            const reponame = req.params.reponame;
            console.log("Repository:", reponame);
    
            // Fetch contributors for the repository
            let contributors = {};
            try {
                const contributorsResponse = await axios.get(`https://api.github.com/repos/${username}/${reponame}/contributors`);
                if (Array.isArray(contributorsResponse.data) && contributorsResponse.data.length > 0) {
                    // Extract contributors and their contributions count
                    contributors = contributorsResponse.data.reduce((obj, contributor) => {
                        obj[contributor.login] = contributor.contributions;
                        return obj;
                    }, {});
                } else {
                    contributors = { "Not available right now": "Not available right now" };
                }
            } catch (error) {
                console.error(`Error fetching contributors for ${reponame}:`, error.message);
                contributors = { "Not available right now": "Not available right now" };
            }
    
            // Fetch recent commits for the repository
            let recentCommits = [];
            try {
                const commitsResponse = await axios.get(`https://api.github.com/repos/${username}/${reponame}/commits`);
                recentCommits = commitsResponse.data.map(commit => ({
                    message: commit.commit.message,
                    author: commit.commit.author.name,
                    date: commit.commit.author.date,
                }));
            } catch (error) {
                console.error(`Error fetching commits for ${reponame}:`, error.message);
                recentCommits = [{ "message": "Not available right now", "author": "Not available right now", "date": "Not available right now" }];
            }
    
            // Fetch open issues for the repository
            let openIssues = [];
            try {
                const issuesResponse = await axios.get(`https://api.github.com/repos/${username}/${reponame}/issues`);
                openIssues = issuesResponse.data.map(issue => ({
                    title: issue.title,
                    state: issue.state,
                    author: issue.user.login,
                    created_at: issue.created_at,
                }));
            } catch (error) {
                console.error(`Error fetching issues for ${reponame}:`, error.message);
                openIssues = [{ "title": "Not available right now", "state": "Not available right now", "author": "Not available right now", "created_at": "Not available right now" }];
            }
    
            // Combine all data
            const responseData = {
                contributors: contributors,
                commits: recentCommits,
                issues: openIssues
            };
    
            // Send the retrieved data as JSON response
            res.status(200).json(responseData);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                return res.status(404).json({ msg: 'Repository not found' });
            }
            console.error('Error listing contributors, commits, and issues:', err.message);
            res.status(500).json({ msg: 'Internal server error' });
        }
    };
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
    
    module.exports = {signUp,gettingCard,allUsers,login,searchUsers,logout,repositoryTable,listContributors};