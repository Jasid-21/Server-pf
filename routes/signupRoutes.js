const express = require('express');
const router = express.Router();
const connection = require('./database.js');
const bcrypt = require('bcrypt');
const moment = require('moment');

router.post('/signup', function(req, resp) {
    const username = req.query.username;
    const pass = req.query.password;
    const date = moment().format('YYYY-MM-DD hh:mm:ss');
    console.log(username);

    connection.query(`SELECT * FROM users WHERE Username = '${username}'`, function(error, data){
        if(error){
            console.log(error);
            resp.status(500).send({message: "Error conecting to database..."});
        }else{
            if(data.length > 0){
                resp.status(401).send();
            }else{
                const password = bcrypt.hashSync(pass, 10);
                connection.query(`INSERT INTO users (Username, Pass, Creation_date) 
                VALUES ('${username}', '${password}', '${date}')`, function(error, ret){
                    if(error){
                        console.log(error);
                        resp.status(500).send("Error creating user...");
                    }else{
                        const id = ret.insertId;
                        create_session(id).then(function(response){
                            if(response.status == 0){
                                resp.status(500).send({message: "Error creating session"});
                            }else{
                                resp.status(200).send({session_id: response.token});
                            }
                        }).catch(function(error){
                            console.log(error)
                            resp.status(500).send({message: "Error creating session..."});
                        })
                    }
                });
            }
        }
    });
});


//FUNCTIONS
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