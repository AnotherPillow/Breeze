//make a users table in users.sqlite
const fs = require('fs');

if (fs.existsSync('users.sqlite')) fs.unlinkSync('users.sqlite');
if (!fs.existsSync('groups')) fs.mkdirSync('groups');

if (!fs.existsSync('groups/groups.json')) fs.writeFileSync('groups/groups.json', JSON.stringify({}));
if (!fs.existsSync('groups/members.json')) fs.writeFileSync('groups/members.json', JSON.stringify({}));

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('users.sqlite', (err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to the users database.');
});
db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)", (err) => {
    if (err) {
        throw err;
    }
    console.log('Created users table.');
});

db.close();