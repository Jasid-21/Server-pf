const express = require('express');
const router = express.Router();
const connection = require('./database.js');


router.get('/home', function (req,res){
  const session =req.query.session;

     connection.query(`SELECT alarms.Alarm_date, alarm_types.Alarm_type,users.Username , user_resps.User_resp FROM alarms
        inner join hardwares on alarms.Hard_id = hardwares.Id
        inner join alarm_types on  alarms.Type_id = alarm_types.Id
        inner join sessions on hardwares.owner_id = sessions.Id
        inner join users on sessions.User_id = users.Id
        inner join user_resps on alarms.Resp_id = user_resps.Id
        WHERE sessions.session = '${session}' 
        order by alarms.id desc
        limit 1`,(err, info)=>{
        if (err) throw err
        else{
        res.status(200).json({
        data: info,
      });}
    })

});

router.get('/history', function (req,res){ 
  const User_id =req.query.User_id;

    connection.query(`SELECT alarms.Alarm_date, alarm_types.Alarm_type,users.Username , user_resps.User_resp FROM alarms
       inner join hardwares on alarms.Hard_id = hardwares.Id
       inner join alarm_types on  alarms.Type_id = alarm_types.Id
       inner join sessions on hardwares.owner_id = sessions.Id
       inner join users on sessions.User_id = users.Id
       inner join user_resps on alarms.Resp_id = user_resps.Id
       WHERE sessions.User_id = '${User_id}' 
       order by alarms.id `,(err, history)=>{
        if (err) throw err
        else{
       res.status(200).json({
       data: history,
     });}
   })

});

app.post('/resp',(req,res)=>{

    connection.query(`INSERT INTO User_resps(User_resp) VALUES (?) `,[
     req.query.User_resp
    ]),(err, result) =>{
      if (err) throw err
      else 
      {
        console.log("Respuesta recibida", result);  
      }
    }

})



module.exports = router;