const express = require('express');
const router = express.Router();
const connection = require('./database.js');


router.get('/home', function (req,res){

     connection.query(`SELECT alarms.Alarm_date, alarm_types.Alarm_type,users.Username , user_resps.User_resp FROM alarms
        inner join hardwares on alarms.Hard_id = hardwares.Id
        inner join alarm_types on  alarms.Type_id = alarm_types.Id
        inner join sessions on hardwares.owner_id = sessions.Id
        inner join users on sessions.User_id = users.Id
        inner join user_resps on alarms.Resp_id = user_resps.Id
        WHERE sessions.user_id = '${user_id}' 
        order by alarms.id desc
        limit 2`,(err, info)=>{
        res.status(200).json({
        data: info,
      });
    })

});

router.get('/history', function (req,res){ 

    connection.query(`SELECT alarms.Alarm_date, alarm_types.Alarm_type,users.Username , user_resps.User_resp FROM alarms
       inner join hardwares on alarms.Hard_id = hardwares.Id
       inner join alarm_types on  alarms.Type_id = alarm_types.Id
       inner join sessions on hardwares.owner_id = sessions.Id
       inner join users on sessions.User_id = users.Id
       inner join user_resps on alarms.Resp_id = user_resps.Id
       WHERE sessions.user_id = '${user_id}' 
       order by alarms.id `,(err, history)=>{
       res.status(200).json({
       data: history,
     });
   })

});

app.post('/resp',(req,res)=>{

    connection.query(`INSERT INTO User_resps(User_resp) VALUES (?) `,[
        req.query.User_resp
    ])

})



module.exports = router;