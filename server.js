// imports
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);


// global variables
const port = 5000;
var roundCount = 0;
var roundSubmissions = {};
var allHeadlines = [];
var submissionsPerRound = {0: allHeadlines};
var aliveSockets = [];    // all connected sockets
var aliveSubmitters = []; // all connected sockets with submissions
var minRemainingHeadlines = 3; // to decide when to end poll


// routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
})


// helper functions //
function updateAliveSockets(id, operation) {
  if (operation === 'insert'){
    aliveSockets.push(id);
  } else {
    aliveSockets.splice(aliveSockets.indexOf(id), 1);
  }
  io.emit('participantUpdate', aliveSockets.length);  // broadcast new number of connected sockets
}

function updateRoundSubmissions(id, submission, operation){
  if (operation === 'insert'){
    roundSubmissions[id] = submission;
  } else {
    delete roundSubmissions[id];
  }
}

function updateAliveSubmitters(id, operation){
  if (operation === 'insert'){
    aliveSubmitters.push(id);
  } else {
    aliveSubmitters.splice(aliveSubmitters.indexOf(id), 1);
  }
  io.emit('submissionsCount', `${aliveSubmitters.length}/${aliveSockets.length} submitted`); // broadcast new number of submitters
}

function contentsOf(array){
  return array.toString();
}

function getArrayOfAllRoundSubmissions(submissions){
  // submissions --> {id: array}
  var output = [];
  for (id in submissions) {
    // include unique submissions only
    if (!output.includes(contentsOf(submissions[id]))){
      output = output.concat(submissions[id]);
    }
  }
  return output;
}

function endRound(input) {
  roundCount += 1;
  submissionsPerRound[roundCount] = input;
  roundSubmissions = {};
  aliveSubmitters = [];
}

function endPoll(){
  roundCount = 0;
}



io.on('connection', (socket) => {

  if (!aliveSockets.includes(socket.id)) {
    updateAliveSockets(socket.id, 'insert');
  }

  socket.on('submission', function(submission){
    // submission --> array

    if (aliveSubmitters.includes(socket.id)){
      updateRoundSubmissions(socket.id, submission, 'insert');
    } else {
      updateRoundSubmissions(socket.id, submission, 'insert');
      updateAliveSubmitters(socket.id, 'insert');
    }

    if (aliveSubmitters.length === aliveSockets.length){
      var roundSubmissionsArray = getArrayOfAllRoundSubmissions(roundSubmissions); // so that clients don't have to each do this separately
      io.emit('allSubmissions', {'roundSubmissionsArray': roundSubmissionsArray, 'roundSubmissions': roundSubmissions});
      endRound(roundSubmissionsArray);

      // when poll is over
      if (roundSubmissionsArray.length <= minRemainingHeadlines){
        endPoll();
        io.emit('pollClosing', roundSubmissionsArray);
      }
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


server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
