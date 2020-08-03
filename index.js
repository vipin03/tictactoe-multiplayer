var express = require('express'),app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var games =[];
 var path = require('path')
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  socket.on('plot', function(msg){
    var data= {'id':msg.id,'val':msg.val}
    console.log(data);
    io.in("room-"+msg.code).emit('plot', data);
  });


  socket.on('create', function(createRequest){
    let randCode=new Date().getUTCMilliseconds();
    let createData= {'username':createRequest.username,'code':randCode} 
    pushToGame(createData);
    socket.join("room-"+randCode);
    io.in("room-"+randCode).emit('create', createData);
  })

  socket.on('join', function(joinRequest){
    let current_game=updateGame(joinRequest)
    if(current_game){
      socket.join("room-"+joinRequest.code);
      io.sockets.in("room-"+joinRequest.code).emit('startGame', current_game);
    }
  });


  socket.on('result', function(resultRequest){
    let endData= {'username':resultRequest.username,'code':resultRequest.code,'result':resultRequest.result}
    endGame(endData);
    io.sockets.in("room-"+resultRequest.code).emit('endGame', endData);
  });
  
  //on disconnection
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function pushToGame(createData)
{
  let obj={
    'username1':createData.username,
    'username2':'',
    'winner':'',
    'result':'',
    'started':false,
    'code':createData.code
  }
  games.push(obj);
  console.log('created:',games);
}
function updateGame(joinData)
{
  let current_game='';
  if(joinData.code!=''){
    let flag=false;
    let obj = games.find((o, i) => {
        if (o.code == joinData.code) {
          current_game =games[i] = {
                    'username1':o.username1,
                    'username2':joinData.username,
                    'winner':'',
                    'result':'',
                    'started':true,
                    'code':joinData.code
                  };
            flag=true;
            return true; // stop searching
        }
    });
    console.log('chnged:',games);
    return current_game;
  }else{
    return false;
  }
}
function endGame(endData)
{
  let current_game='';
  if(endData.code!=''){
    let flag=false;
    let obj = games.find((o, i) => {
        if (o.code == endData.code) {
          current_game =games[i] = {
                    'username1':o.username1,
                    'username2':o.username2,
                    'winner':endData.username,
                    'result':endData.result,
                    'started':true,
                    'code':o.code
                  };
            flag=true;
            return true; // stop searching
        }
    });
    console.log('ended:',games);
    return true;
  }else{
    return false;
  }
}
