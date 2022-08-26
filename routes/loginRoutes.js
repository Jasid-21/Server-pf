const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const connection = require('./database');


router.use(cookieParser());
router.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

router.post('/login', function(req, resp) {
    const username = req.query.username;
    const pass = req.query.password;

    connection.query(`SELECT * FROM users WHERE Username = '${username}'`, function(error, data){
        if(error){
            console.log(error);
            resp.status(500).send("Error logining. Please try later...");
        }else{
            if(data.length > 0){
                const hash = data[0].Pass;
                if(bcrypt.compare(pass, hash)){
                    create_session(Number(data[0].Id)).then(function(resolved){
                        resp.cookie('session_id', resolved.token, {maxAge: 2600000*1000}).send({status: 1});
                    }, function(rejected){
                        console.log(rejected);
                        resp.status(500).send({status: 0, message: "Error creating session..."});
                    });
                }else{
                    resp.status(400).send();
                }
            }else{
                resp.send({status: 0, message: "User not found..."});
            }
        }
    });
});

router.post('/logout', function(req, resp){
    const cookie = req.cookies['session_id'];

    connection.query(`DELETE FROM Sessions WHERE Session = '${cookie}'`, function(error){
        if(error){
            console.log(error);
            resp.status(500).send({status: 0, message: error});
        }else{
            resp.status(200).send({status: 1});
        }
    });
});






//FUNCTIONS.
async function create_session(user){
    return(new Promise(async function(resolve, reject){
        var id;
        if(typeof user == "string"){
            id = await get_user_id(user)
        }else{
            id = user;
        }

        if(typeof id != "number"){
            reject({status: 0, message: "Error creating session..."});
        }else{
            const token = create_token(30);
            connection.query(`INSERT INTO sessions (User_id, Session) VALUES ('${id}', '${token}')`, function(error){
                if(error){
                    console.log(error);
                    reject({status: 0, message: "Error creating session..."});
                }else{
                    resolve({status: 1, token: token})
                }
            });
        }
    }));
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

async function get_user_id(username){
    return(
        new Promise(function(resolve, reject){
            connection.query(`SELECT Id FROM Users WHERE username = '${username}'`, function(error, data){
                if(error){
                    reject(error);
                }else{
                    if(data.length > 0){
                        resolve(data[0]);
                    }else{
                        reject("User nor found...");
                    }
                }
            });
        })
    )
}

module.exports = router;