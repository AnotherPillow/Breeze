const express = require('express');
const app = express();
const sqlite3 = require("sqlite3").verbose();
const fs = require('fs');
const config = require('./config.json');
//const bodyParser = require('body-parser');

app.engine('html', require('ejs').renderFile);
app.use(express.json());

app.get('/', function(req, res) {
    res.render('index.html');
})

app.get('/messaging', function(req, res) {
    if (!req.query.username || !req.query.password) return res.redirect('/signup');
    //check if user exists
    let db = new sqlite3.Database('users.sqlite', (err) => {
        if (err) {
            res.status(500).json({code: 500, message: 'Error connecting to database.'});
            return console.error(err.message);
        }
    });
    db.get(`SELECT * FROM users WHERE username = ?`, [req.query.username], (err, row) => {
        if (err) {
            res.status(500).json({code: 500, message: 'Error connecting to database.'});
            return console.error(err.message);
        }
        if (!row) {
            return res.redirect('/signup');
            //return console.error('User does not exist.');
        }
        if (row.password !== req.query.password) {
            return res.redirect('/signup');
//            return console.error('Incorrect password.');
        };
        return res.render('messaging.html', {username: req.query.username, password: req.query.password});
    })
    //db.close();
    
})

app.post('/api/message', function(req, res) {
    //console.log(req.body);
    let groupID = req.body.group_id.toString();
    let username = req.body.username;
    let password = req.body.password;
    let message = req.body.message;
    let file = JSON.parse(fs.readFileSync('groups/groups.json'));
    if (!file[groupID]) return res.status(500).json({code: 500, message: 'Group does not exist.'});
    if (file[groupID].members.indexOf(username) === -1) return res.status(500).json({code: 500, message: 'You are not a member of this group.'});

    let db = new sqlite3.Database('users.sqlite', (err) => {
        if (err) {
            res.status(500).json({code: 500, message: 'Error connecting to database.'});
            return console.error(err.message);
        }
    });
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            res.status(500).json({code: 500, message: 'Error connecting to database.'});
            return console.error(err.message);
        }
        if (!row) {
            res.status(403).json({code: 403, message: 'User does not exist.'});
            return console.error('User does not exist.');
        }
        if (row.password !== password) {
            res.status(403).json({code: 403, message: 'Incorrect password.'});
            return console.error('Incorrect password.');
        }
        file[groupID].latest = {
            name: username,
            message: message || 'No message.'
        }
        try {
            fs.writeFileSync('groups/groups.json', JSON.stringify(file, null, 4));
            res.status(200).json({code: 200, message: 'Message sent.', file: file[groupID]});
        } catch (err) {
            res.status(500).json({code: 500, message: 'Error saving message.'});
            return console.error(err.message);
        }
    })
})  

app.post('/api/latest_message', function(req, res) {
    let groupID = req.body.group_id.toString();
    let file = JSON.parse(fs.readFileSync('groups/groups.json'));
    if (!file[groupID]) {
        console.log('Group does not exist.');
        //console.log(file, groupID);
        return res.status(500).json({code: 500, message: 'Group does not exist.'})
    };
    return res.status(200).json({
        code: 200,
        message: file[groupID].latest,
        name: file[groupID].name,
        members: file[groupID].members,
        id: groupID
    });
})

app.get('/signup', function(req, res) {
    res.render('signup.html');
})

app.post('/api/signup', function(req, res) {
    //console.log(req.body);
    let username = req.body.username.toLowerCase().trim();
    if (req.body.password !== req.body.password2) return res.status(500).send('Passwords do not match.');
    if (req.body.password.length < 8) return res.status(500).send('Password must be at least 8 characters long.');
    let db = new sqlite3.Database('users.sqlite', (err) => {
        if (err) {
            res.status(500).json({code: 500, message: 'Error connecting to database.'});
            throw err;
        }
        console.log('Connected to the users database.');
    });
    //check if user exists
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            res.status(500).json({code: 500, message: 'Error connecting to database.'});
            throw err;
        }
        if (row) 
            return res.status(500).json({code: 500, message: 'User already exists.'});
        
        //create user
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, req.body.password], (err) => {
            if (err) {
                res.status(500).json({code: 500, message: 'Error connecting to database.'});
                throw err;
            }
            let membersFile = JSON.parse(fs.readFileSync('groups/members.json'));
            if (!membersFile[username]) membersFile[username] = [];
        });
    });
    res.status(200).json({code: 200, message: 'User created'});
    db.close();
})
app.post('/api/login', function(req, res) {
    //console.log(req.body);
    //check if the account login is correct
    let password = req.body.password.trim();
    let username = req.body.username.toLowerCase().trim();

    if (!password || !username)
        return res.json({code: 403, message: 'Please enter a username and password.'});
    let db = new sqlite3.Database('users.sqlite', (err) => {
        if (err) {
            res.json({code: 500, message: 'Error connecting to database.'});
            throw err;
        }
        console.log('Connected to the users database.');
    });
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            res.json({code: 500, message: 'Error connecting to database.'});
            throw err;
        }
        console.log(
            row,
            password,
            username
        )
        if (!row)
            return res.json({code: 403, message: 'Incorrect username.'});
        if (row.password.trim() !== password)
            return res.json({code: 403, message: 'Incorrect password.'});
        res.json({code: 200, message: 'Login successful.'});
    });
    db.close();
})

app.get('/api/groups', function(req, res) {
    let username = req.query.username.toLowerCase().trim();
    let jsonFile = JSON.parse(fs.readFileSync('groups/members.json'));
    //console.log(jsonFile);
    if (jsonFile[username]) {
        return res.json({code: 200, message: 'You are a member of the following groups.', groups: jsonFile[username]});
    } else {
        return res.json({code: 403, message: 'You are not a member of any groups.', groups: []});
    }
});

app.post('/api/create_group', function(req, res) {
    let username = req.body.username.toLowerCase().trim();
    let password = req.body.password.trim();
    let groupName = req.body.group_name.trim();
    let members = req.body.members;
    let db = new sqlite3.Database('users.sqlite', (err) => {
        if (err) {
            res.json({code: 500, message: 'Error connecting to database.'});
            throw err;
        }
        console.log('Connected to the users database.');
    });
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            res.json({code: 500, message: 'Error connecting to database.'});
            throw err;
        }
        if (!row)
            return res.json({code: 403, message: 'Incorrect username.'});
        if (row.password.trim() !== password)
            return res.json({code: 403, message: 'Incorrect password.'});
        //check if group name is taken
        let groupsFile = JSON.parse(fs.readFileSync('groups/groups.json'));

        let groupsIdList = Object.keys(groupsFile);
        
        let nextGroupID = groupsIdList.length > 0 ? groupsFile[groupsIdList.reduce((a, b) => a.id > b.id ? a : b)].id + 1 : 1;
        groupsFile[nextGroupID.toString()] = {
            name: groupName,
            members: members,
            id: nextGroupID,
            latest: {
                name: null,
                message: "Welcome to the group! Be the first to send a message!",
            },
        };
        fs.writeFileSync('groups/groups.json', JSON.stringify(groupsFile));
        let membersFile = JSON.parse(fs.readFileSync('groups/members.json'));
        for (let member of members) {
            if (!membersFile[member]) membersFile[member] = [];
            membersFile[member].push({
                name: groupName,
                id: nextGroupID,
            });
        }
        fs.writeFileSync('groups/members.json', JSON.stringify(membersFile));
    }); 

})

//run the server
app.listen(config.port, config.host, () => {
    console.log(`Server running at http://${config.host}:3000/`);
});
app.use('/public',express.static('public'));