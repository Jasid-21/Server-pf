const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '34.28.6.134',
    user: 'root',
    password: 'JFG728`@CC:$d.M&',
    database: 'homesecurity'
});

connection.connect(function(error) {
    if(error) {
        console.log(error);
    }else {
        console.log("Connection established");
    }
});

module.exports = connection;
