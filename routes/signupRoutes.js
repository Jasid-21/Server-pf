const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const connection = require('./database.js');
const bcrypt = require('bcrypt');



router.use(cookieParser());


router.get('/signup', function(req, resp) {
    resp.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});

router.post('/signup', function(req, resp) {
    const username = req.query.username;
    const pass = req.query.password;
    console.log(pass);

    connection.query(`SELECT * FROM users WHERE Username = '${username}'`, function(error, data){
        if(error){
            console.log(error);
            resp.status(500);
        }else{
            if(data.length > 0){
                resp.send({status: 0, message: "This username is alredy in use"});
            }else{
                const password = bcrypt.hashSync(pass, 10);
                connection.query(`INSERT INTO users (Username, Pass) 
                VALUES ('${username}', '${password}')`, function(error, ret){
                    if(error){
                        console.log(error);
                        resp.status(500);
                    }else{
                        const id = ret.insertId;
                        create_session(id).then(function(response){
                            if(response.status == 0){
                                resp.status(500);
                            }else{
                                resp.status(200).cookie('session_id', response.token, {maxAge: 2600000*1000}).send({status: 1});
                            }
                        }).catch(function(error){
                            console.log(error)
                            resp.status(500).send("Error creating session...");
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