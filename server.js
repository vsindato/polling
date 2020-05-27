const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = 5000;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})


// global variables

var roundCount = 0;
var roundSubmissions = {};
var allHeadlines = [];
var submissionsPerRound = {0: allHeadlines};

var aliveSockets = []; // ids of all connected sockets
var aliveSubmitters = [];




// helper functions

function updateRoundSubmissions(id, submission, operation){
  if (operation === 'insert'){
    roundSubmissions[id] = submission;
  } else {
    delete roundSubmissions[id];
  }
}

function updateAliveSockets(id, operation) {
  if (operation === 'insert'){
    aliveSockets.push(id);
  } else {
    aliveSockets.splice(aliveSockets.indexOf(id), 1); // remove socket's id from array of alive sessions
  }
  io.emit('participantUpdate', aliveSockets.length);
}

function updateAliveSubmitters(id, operation){
  if (operation === 'insert'){
    aliveSubmitters.push(id);
  } else {
    aliveSubmitters.splice(aliveSubmitters.indexOf(id), 1);
  }
  io.emit('submissionsCount', `${aliveSubmitters.length}/${aliveSockets.length} users have submitted`);
}


function getArrayOfAllRoundSubmissions(submissions){
  // input is an object where key= id, value = array
  var output = [];
  for (id in submissions) {
    output = output.concat(submissions[id]);
  }
  return output;
}

function endRound(input) {
  roundCount += 1;
  submissionsPerRound[roundCount] = input;
  roundSubmissions = {};
  aliveSubmitters = [];

}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
})


io.on('connection', (socket) => {
  // Add new sessions to ones that have been observed
  if (!aliveSockets.includes(socket.id)) {
    updateAliveSockets(socket.id, 'insert');
  }

  // submission event
  socket.on('submission', function(submission){
    // submission is an array
    // prevent single user from increasing submission count more than once
    if (!aliveSubmitters.includes(socket.id)){
      updateRoundSubmissions(socket.id, submission, 'insert');
      updateAliveSubmitters(socket.id, 'insert');
    }

    // when everyone has submitted
    if (aliveSubmitters.length === aliveSockets.length){
      var roundSubmissionsArray = getArrayOfAllRoundSubmissions(roundSubmissions); // so that clients don't have to each do this separately
      io.emit('allSubmissions', {'roundSubmissionsArray': roundSubmissionsArray, 'roundSubmissions': roundSubmissions});
      endRound(roundSubmissionsArray);
    }

  })

  // disconnect event
  socket.on('disconnect', function(){
    updateAliveSockets(socket.id, 'remove');
    if (aliveSubmitters.includes(socket.id)){
      updateAliveSubmitters(socket.id, 'remove');
    }
    updateRoundSubmissions(socket.id, null, 'remove');
  })
})
