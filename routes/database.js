const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'recipes'
});

connection.connect(function(error) {
    if(error) {
        console.log(error);
    }else {
        console.log("Connection established");
    }
});

module.exports = connection;