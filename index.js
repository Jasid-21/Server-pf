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



// Add new intruder detenction to database.
// Add new fire detection to database.
// Consult database to show info.
// Send response to hardware.



// Functions
function verify_session(req, resp, next){
    const cookie = req.cookies['session_id'];
    get_session(cookie).then(function(resolved){
        req.user_id = resolved.User_id;
        req.username = resolved.Name;
        next();
    }, function(rejected){
        console.log(rejected);
        resp.redirect('/login');
    });
}

async function get_session(cookie){
    return(
        new Promise(function(resolve, reject){
            connection.query(`SELECT * FROM Sessions 
            INNER JOIN Users ON Sessions.User_id = Users.Id AND Sessions.Session = '${cookie}'`, function(error, data){
                if(error){
                    reject(error);
                }else{
                    if(data.length > 0){
                        resolve(data[0]);
                    }else{
                        reject("Session not found...");
                    }
                }
            });
        })
    )
}

app.listen(app.get('port'), function() {
    console.log('listening on port ' + app.get('port'));
});
