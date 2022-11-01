const express = require('express');
const app = express();

const bcrypt = require('bcrypt');
const parser  = require('cookie-parser');
const path = require('path');
const connection = require('./routes/database');
const moment = require('moment');
const net = require('net');
const Server = require('socket.io').Server;

var sockets = new Array();

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('./routes/loginRoutes.js'));
app.use(require('./routes/signupRoutes.js'));

const httpServer = app.listen(app.get('port'), function() {
    console.log('Http listening on port ' + app.get('port'));
});

const io = new Server(httpServer);
io.on('connection', function() {
    console.log("New client");
});

io.on('message', function(msg) {
    console.log(msg);
});

io.listen(3002);












app.get('/test', function(req, resp) {
    console.log("Enter in test...");
    const port = app.get('port');
    resp.status(200).send(`http listening in port: ${port}`);
});

const server = net.createServer(socket => {
    const date = moment();
    const code = date.format('YYYY') + date.format('MM') + date.format('DD') + create_token(5);
    sockets.push([socket, code]);

    socket.write(code);

    socket.on('data', (data) => {
        console.log(data.toString());
        const array = data.toString().split('-');

        if (Number(array[0]) == 0) {
            const old = array[1];
            const code = array[2];

            //Find and delete old connection.
            for (var i=0; i<sockets.length; i++) {
                if (sockets[i][1] == code) {
                    sockets.splice(i, 1);
                    break;
                }
            }

            //Stablish the new connection.
            for (var s in sockets) {
                if (s[1] == old) {
                    s[1] = code;
                }
            }

            //Send test message to client.
            socket.write("Done! \n");
        } else {
            console.log(data.toString());
        }
    });
});

setInterval(function() {
    if (sockets.length > 0) {
        for (var i = 0; i<sockets.length; i++) {
            const s = sockets[i];
    
            try {
                s[0].write("Test!");
            } catch(err) {
                console.log(err);
            }
        }
    }
}, 10000);

server.listen(3001, () => {
    console.log("WebSocket listening in port: 3001");
});

// Check hardware status.

app.get('/check_status', function(req, resp) {
    const session = req.query.session;
    get_session(session).then(function(resolved) {
        if (resolved) {
            //[Here must be wrote the algorythm to check status to hardware]
            resp.status(200).send();
        } else {
            resp.status(401).send({message: "Unauthorized action. Session not found..."});
        }
    }, function(rejected) {
        resp.status(500).send({message: "Server error. Please, try latter..."});
    });
})



app.get('/check_user', function(req, resp) {
    const session_id = req.query.session_id;

    connection.query(`SELECT Id FROM sessions WHERE Session = '${session_id}'`, function(error, data) {
        if (error) {
            console.log(error);
            resp.status(500).send({message: "Error trying to connect with database..."});
        } else {
            if (data.length > 0) {
                resp.status(200).send();
            } else {
                resp.status(401).send();
            }
        }
    });
});

// Add new intruder detenction to database.
// Add new fire detection to database.
// Send response to hardware.

// Consult database to show info.
app.get('/alarms', function(req, resp) {
    const session = req.query.session;
    const user_id = req.query.user;
    const hard_id = req.query.hard;

    get_session(session).then(function(resolved) {
        if (resolved) {
            connection.query(`SELECT al.Id, al.Type_id, al.Alarm_date, aty.Alarm_type, ur.User_resp FROM alarms al
            INNER JOIN alarm_types aty ON al.Type_id = aty.Id
            INNER JOIN user_resps ur ON al.Resp_id = ur.Id
            WHERE al.Hard_id = ${hard_id};`, function(error, data) {
                if (error) {
                    console.log(error);
                    resp.status(500).send({message: "Server error. Pease, try latter..."});
                } else {
                    console.log(data);
                    resp.status(200).send({items: data});
                }
            });
        } else {
            resp.status(401).send({message: "Unauthorized action. Session not found..."});
        }
    }, function(rejected) {
        resp.status(500).send({message: "Server error. Pease, try latter..."});
    });
});

app.get('/hardwares', function(req, resp) {
    const session_id = req.query.session;
    const user_id = req.query.user_id;
    console.log(session_id);

    get_session(session_id).then(function(resolved) {
        if (resolved) {
            connection.query(`SELECT * FROM hardwares WHERE Owner_id=${user_id}`, function(error, data) {
                if (error) {
                    resp.status(500).send({message: "Sorry. Server error. Please, try later..."});
                } else {
                    const items = data[0];
                    console.log(data);
                    resp.status(200).send({items: data});
                }
            });
        } else {
            resp.status(401).send({message: 'Unauthorized action. Incorrect session provided...'});
        }
    },
    function(rejected) {
        resp.status(500).send({message: "Sorry. Server error. Please, try later..."});
    });
});

app.post('/newHardware', function(req, resp) {
    console.log("Enter in newHardware...");
    const session = req.query.session;
    const user = req.query.user;
    const name = req.query.name;
    const address = req.query.address;
    const code = req.query.code;
    const date = moment().format('YYYY-MM-DD HH:mm:ss');

    console.log(session);

    get_session(session).then(
        function(resolved){
            console.log(resolved);
            if (resolved) {
                connection.query(`INSERT INTO hardwares (Hard_serie, Instalation_date, Address, Owner_id, Name) 
                VALUES ('${code}', '${date}', '${address}', '${user}', '${name}');`, function(error) {
                    if (error) {
                        console.log(error);
                        resp.status(500).send({message: "Sorry. Server error. Please, try later..."});
                    } else {
                        resp.status(200).send();
                    }
                });
            } else {
                resp.status(401).send({message: "Session not found..."});
            }
        },
        function(rejected){
            resp.status(500).send({message: "Sorry. Server error. Please, try later..."});
        }
    );
});



// Functions
async function get_session(cookie){
    return(
        new Promise(function(resolve, reject){
            connection.query(`SELECT * FROM Sessions 
            INNER JOIN Users ON Sessions.User_id = Users.Id AND Sessions.Session = '${cookie}'`, function(error, data){
                if(error){
                    console.log(error);
                    reject(error);
                }else{
                    if(data.length > 0){
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                }
            });
        })
    )
}

function create_token(tam){
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = upper.toLowerCase();
    const number = "0123456789";
    const total = upper + lower + number;
    var token = "";

    for(var i=0; i<tam; i++){
        token += total[Math.floor(Math.random()*(total.length - 1))];
    }

    return token;
}
