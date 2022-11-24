const express = require('express');
const app = express();

const bcrypt = require('bcrypt');
const parser  = require('cookie-parser');
const path = require('path');
const connection = require('./routes/database');
const moment = require('moment');
const net = require('net');
const Server = require('websocket').server;

var sockets = new Array();
var webSockets = new Array();
var pivote = new Array();

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('./routes/loginRoutes.js'));
app.use(require('./routes/signupRoutes.js'));

const httpServer = app.listen(app.get('port'), function() {
    console.log('Http listening on port ' + app.get('port'));
});

const socketServer = new Server({
    httpServer:httpServer,
    autoAcceptConnections: false
});

socketServer.on('request', function(request) {
    const connection = request.accept(null, request.origin);
    console.log("New user connected!");

    connection.on('message', (msg) => {
        const utf = JSON.parse(msg.utf8Data);

        console.log(utf);
        if (utf.type == 'code') {
            const user_id = utf.msg;

            var found = false;
            for (var client of webSockets) {
                if (client[0] == user_id) {
                    client[1] = connection;
                    found = true;
                    break;
                }
            }

            if (!found) {
                webSockets.push([user_id, connection]);
            }
        }
    });

    connection.on('close', (code, desc) => {
        console.log("Websocket connection lost...");
    });

    connection.on('error', (err) => {
        console.log(err);
    });
});

const server = net.createServer(socket => {
    socket.setKeepAlive(true,10000);
    const date = moment();
    const code = date.format('YYYY') + date.format('MM') + date.format('DD') + create_token(5);
    sockets.push([socket, code]);

    socket.write(code);

    socket.on('data', (data) => {
        const array = data.toString().split('-');
        console.log("array: ", array);
        
        if (array.length != 3) {
            return;
        }
        const num = Number(array[0]);
        if (num == 0) {
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
            for (var s of sockets) {
                if (s[1] == old) {
                    s[1] = code;
                }
            }

            //Send test message to client.
            socket.write("Done! \n");
        }

        if (num != 0) {
            //Register in database.
            const code = array[1];
            var type;
            if (array[2].length > 0) {
                type = array[2][array[2].length - 1];
            }
            
            console.log(type);

            connection.query(`SELECT * FROM hardwares WHERE Hard_serie = '${code}'`, function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    const row = data[0];
                    const hard_id = row.Id;
                    const date = moment().format('YYYY-MM-DD HH:mm:ss');

                    if (type == '1' || type == '2' || type == '3') {
                        connection.query(`INSERT INTO alarms (Hard_id, Alarm_date, Type_id, Resp_id)
                        VALUES (${hard_id}, '${date}', ${type}, 1)`, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                }
            });

            //Send alert to app.
            var found1 = false;
            for (var piv of pivote) {
                if (piv[1] == code) {
                    found1 = true;
                    const user_id = piv[0];
                    
                    var found2 = false;
                    for (var client of webSockets) {
                        if (client[0] == user_id) {
                            found2 = true;

                            var i;

                            for (i=0; i<2; i++) {
                                var msg_send;
                                if (Number(type) == 1) {
                                    msg_send = 'Intruder detection!!';
                                }
                                if (i=1){
                                    client[1].send(JSON.stringify({type: 'alert', msg: msg_send, sens: type}));
                                    break;
                                }


                            }
                           

                            if (Number(type) == 3) {
                                msg_send = 'Fire detection!!';
                                client[1].send(JSON.stringify({type: 'alert', msg: msg_send, sens: type}));
                            break;
                            }

                            if (Number(type) == 2) {
                                msg_send = 'Smoke detection!!';
                                client[1].send(JSON.stringify({type: 'alert', msg: msg_send, sens: type}));
                            break;
                            }

                            
                        }
                    }

                    if (!found2) {
                        console.log("Client not found...");
                    }
                }
            }

            if (!found1) {
                console.log("Hardware connection not found...");
            }
        }
    });

    socket.on('error', (err) => {
        console.log(err);
    });

    socket.on('close', () => {
        console.log("socket connection lost...");
    });
});

server.listen(3001, () => {
    console.log("WebSocket listening in port: 3001");
});



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
                    console.log(data);

                    for (var hw of data) {
                        var found = false;
                        for (var piv of pivote) {
                            if (piv[1] == hw.Hard_serie) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            pivote.push([user_id, hw.Hard_serie]);
                        }
                    }

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
            connection.query(`SELECT * FROM sessions 
            INNER JOIN users ON sessions.User_id = users.Id AND sessions.Session = '${cookie}'`, function(error, data){
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
