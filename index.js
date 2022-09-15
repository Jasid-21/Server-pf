const express = require('express');
const app = express();

const bcrypt = require('bcrypt');
const parser  = require('cookie-parser');
const path = require('path');
const connection = require('./routes/database');

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('./routes/loginRoutes.js'));
app.use(require('./routes/signupRoutes.js'));

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
    console.log("Enter in check state");
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



// Functions
async function get_session(cookie){
    return(
        new Promise(function(resolve, reject){
            connection.query(`SELECT * FROM Sessions 
            INNER JOIN Users ON Sessions.User_id = Users.Id AND Sessions.Session = '${cookie}'`, function(error, data){
                if(error){
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

app.listen(app.get('port'), function() {
    console.log('listening on port ' + app.get('port'));
});
