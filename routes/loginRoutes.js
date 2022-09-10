const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const connection = require('./database');
const moment = require('moment');


router.use(cookieParser());

router.post('/login', function(req, resp) {
    const username = req.query.username;
    const pass = req.query.password;

    connection.query(`SELECT * FROM users WHERE Username = '${username}'`, function(error, data){
        if(error){
            console.log(error);
            resp.status(500).send({message: "Error logining. Please try later..."});
        }else{
            if(data.length > 0){
                const hash = data[0].Pass;
                console.log(pass);
                console.log(hash);
                if(bcrypt.compare(pass, hash)){
                    create_session(Number(data[0].Id)).then(function(resolved){
                        resp.status(200).send({session_id: resolved.token, user_id: data[0].Id});
                    }, function(rejected){
                        console.log(rejected);
                        resp.status(500).send({message: "Error creating session..."});
                    });
                }else{
                    resp.status(401).send({message: "Incorrect user ot password..."});
                }
            }else{
                resp.status(401).send({message: "Incorrect user ot password..."});
            }
        }
    });
});

router.post('/logout', function(req, resp){
    const session = req.query.session_id;
    console.log("Enter in logout!");

    connection.query(`DELETE FROM sessions WHERE Session = '${session}'`, function(error){
        if(error){
            console.log(error);
            resp.status(500).send({message: "Error loging out. Please try later..."});
        }else{
            resp.status(200).send();
        }
    });
});






//FUNCTIONS.
async function create_session(user){
    return(new Promise(async function(resolve, reject){
        const date = moment().format('YYYY-MM-DD hh:mm:ss');
        var id;
        if(typeof user == "string"){
            id = await get_user_id(user)
        }else{
            id = user;
        }

        if(typeof id != "number"){
            reject({status: 0, message: "Error creating session..."});
        }else{
            const token = create_token(70);
            connection.query(`INSERT INTO sessions (User_id, Session, Session_date) VALUES 
            ('${id}', '${token}', '${date}')`, function(error){
                if(error){
                    console.log(error);
                    reject({status: 0, message: "Error creating session..."});
                }else{
                    resolve({status: 1, token})
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