const express = require('express');
const connection = require('./database.js');
const router = express.Router();
const connection = require('./database.js');




router.get('/home', function (req,resp){
  const User_id =req.query.User_id;
  const session = req.query.session;

  get_session(session).then(function(resolved) {
    if (resolved) {
      connection.query(`SELECT alarms.Alarm_date, alarm_types.Alarm_type,users.Username , user_resps.User_resp FROM alarms
      inner join hardwares on alarms.Hard_id = hardwares.Id
      inner join alarm_types on  alarms.Type_id = alarm_types.Id
      inner join sessions on hardwares.owner_id = sessions.Id
      inner join users on sessions.User_id = users.Id
      inner join user_resps on alarms.Resp_id = user_resps.Id
      WHERE sessions.User_id = '${User_id}'
      order by alarms.id desc
      limit 1`,
      (error, info)=>{
        if (error) {
          console.log(error);
          resp.status(500).send({message: "Server error. Pease, try latter..."});
        } else {
          console.log(info);
          resp.status(200).send({data: info});
        }
      });
    } else {
        resp.status(401).send({message: "Unauthorized action. Session not found..."});
      }
      }, 
    function(rejected) {
    resp.status(500).send({message: "Server error. Pease, try latter..."});
  });
     
});

router.get('/history', function (req,resp){ 
  const User_id =req.query.User_id;
  const session = req.query.session;

  get_session(session).then(function(resolved) {
    if (resolved) {
      connection.query(`SELECT alarms.Alarm_date, alarm_types.Alarm_type,users.Username , user_resps.User_resp FROM alarms
      inner join hardwares on alarms.Hard_id = hardwares.Id
      inner join alarm_types on  alarms.Type_id = alarm_types.Id
      inner join sessions on hardwares.owner_id = sessions.Id
      inner join users on sessions.User_id = users.Id
      inner join user_resps on alarms.Resp_id = user_resps.Id
      WHERE sessions.User_id = '${User_id}'`,
      (error, history)=>{
        if (error) {
          console.log(error);
          resp.status(500).send({message: "Server error. Pease, try latter..."});
        } else {
          console.log(info);
          resp.status(200).send({data: history});
        }
      });
    } else {
        resp.status(401).send({message: "Unauthorized action. Session not found..."});
      }
      }, 
    function(rejected) {
    resp.status(500).send({message: "Server error. Pease, try latter..."});
  });
   
});


//modificar el campo de la tabla
app.post('/resp',(req,resp)=>{
  const User_id =req.query.User_id;
  const session = req.query.session;

  get_session(session).then(function(resolved) {
    if (resolved) {
  
      connection.query(`INSERT INTO User_resps(User_resp) VALUES (?) `,[
       req.query.User_resp],
      (error, result)=>{
        if (error) {
          console.log(error);
          resp.status(500).send({message: "Server error. Pease, try latter..."});
        } else {
          console.log(info);
          resp.status(200).send({"Respuesta recibida": result });
        }
      });
  
    } else {
        resp.status(401).send({message: "Unauthorized action. Session not found..."});
      }
      }, 
    function(rejected) {
    resp.status(500).send({message: "Server error. Pease, try latter..."});
  });

})




  
  


app.put('/modify',(req,resp)=>{

  const User_id =req.query.User_id;
  const session = req.query.session;
  const Hard_serie=req.query.Hard_serie;
  const Instalation_date = req.query.Instalation_date;
  const Address = req.query.Address;

  get_session(session).then(function(resolved) {
    if (resolved) {

  connection.query(`UPDATE hardwares SET Hard_serie, Instalation_date, Address,
  inner join hardwares on alarms.Hard_id = hardwares.Id
  inner join sessions on hardwares.owner_id = sessions.Id
  inner join users on sessions.User_id = users.Id
  WHERE sessions.User_id = '${User_id}'`,
  (error, update)=>{
    if (!Hard_serie || !Instalation_date || !Address) {
      return resp.status(500).send("No hay suficientes datos");
    }else{
  
    if (error) {
      console.log(error);
      resp.status(500).send({message: "Server error. Pease, try latter..."});
    } else {
      console.log(info);
      resp.status(200).send({data: update});
    }}
  });
} else {
  resp.status(401).send({message: "Unauthorized action. Session not found..."});
}
},
function(rejected) {
  resp.status(500).send({message: "Server error. Pease, try latter..."});
});

})

module.exports = router;