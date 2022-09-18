
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'maryuris11',
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