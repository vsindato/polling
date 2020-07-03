// imports
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

// setting a rendering engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));
// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// resources
app.use(express.static(path.join(__dirname, '/assets')));

// global variables
var port = process.env.PORT || 5000;
    roundCount = 0;
    roundSubmissions = {};
    roundSubmissionsArray = [];
    submissionsPerRound = {0:[]};
    aliveSockets = [];    // all connected sockets
    aliveSubmitters = []; // all connected sockets with submissions
    allInitialHeadlines = [];
    minRemainingHeadlines = 3; // to decide when to end poll
    userNowLoggingIn = null;
    socketToUsername = {};
    visualizationData = [];
    isPollOver = false;

// headlines
var batchSize = 6; // initial number of headlines presented to participants
    neutralHeadlines = require('./assets/json/neutralHeadlines.json');
    misinfoHeadlines = require('./assets/json/misinfoHeadlines.json');
    headlines_to_ids = require('./assets/json/headlines_to_ids.json');

// represent queue backwards eg. in [2,4,6,8], 8 is the front of the queue and 2 is the back of the queue
function queue() {
  this.contents = [];
  this.enqueue = function(input) {
    this.contents.unshift(input);
    return false
  };
  this.dequeue = function() {
    var output = this.contents.pop();
    this.enqueue(output)
    return output;
  }
}

function enqueueAll(queue, array){
  for (var i=0; i < array.length; i++) {
    queue.enqueue(array[i]);
  }
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function createBatch(neutral, misinfo, batchSize) {
  var buffer = [];
  for (var i=0; i < batchSize; i++) {
    if (i < Math.floor(batchSize/2)){
      buffer.push(neutral.dequeue());
    } else {
      buffer.push(misinfo.dequeue());
    }
  }
  return shuffle(buffer)
}

function createBatches(batchSize) {
  batches = []
  for (var i=0; i < Math.floor(Math.min(neutralHeadlines.length, misinfoHeadlines.length)/Math.floor(batchSize/2)); i++) {
    batches.push(createBatch(neutralHeadlinesQueue, misinfoHeadlinesQueue, batchSize))
  }
  return batches
}

function getHeadlineTitles(batch) {
  /**
  batch --> [{headline:string, isMisinfo:boolean, tactic:string}, ...]
  **/
  var titles = [];
  for (var i=0; i<batch.length; i++) {
    titles.push(batch[i].headline)
  }
  return titles
}

function mapToIDs(visdata) {
  var output = [];
  for (var roundIndex=0; roundIndex<visdata.length; roundIndex++){
    var submissionIDs = [];
    for (var submissionIndex=0; submissionIndex<visdata[roundIndex].length; submissionIndex++ ) {
      //console.log(headlines_to_ids[visdata[roundIndex][submissionIndex]]);
      submissionIDs.push(headlines_to_ids[visdata[roundIndex][submissionIndex]]);
    }
    output.push(submissionIDs);
  }
  return output;
}

var neutralHeadlinesQueue = new queue();
    misinfoHeadlinesQueue = new queue();
    firstRoundBatchesQueue = new queue();

enqueueAll(neutralHeadlinesQueue, neutralHeadlines);
enqueueAll(misinfoHeadlinesQueue, misinfoHeadlines);
batches = createBatches(batchSize);
enqueueAll(firstRoundBatchesQueue, batches);

// routes
app.get('/admin', (req, res) => {
  res.render('pages/admin', {title: 'Admin'});
})

app.post('/endRound', (req, res) => {
  if (!isPollOver){
    endRound(roundSubmissionsArray);
  }
  res.render('pages/admin', {title: 'Admin'});
})

app.get('/login', (req, res) => {
  res.render('pages/login', {title: 'Login'});
})

app.post('/story', (req, res) => {
  userNowLoggingIn = req.body.username;
  res.render('pages/story', {title: 'Story'});
})

app.get('/play', (req, res) => {
  userNowLoggingIn = req.body.username;
  var participantBatch = firstRoundBatchesQueue.dequeue();
  var participantFirstHeadlineTitles = getHeadlineTitles(participantBatch);
  allInitialHeadlines = allInitialHeadlines.concat(participantFirstHeadlineTitles);
  res.render('pages/play', {title: 'Play', headlines: participantBatch});
})

app.get('/vis', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  //console.log(visualizationData);
  //res.send(mapToIDs(visualizationData));
  var response = require('./assets/json/visualizationDataFile.json');
  res.send(response);
})

function updateAliveSockets(id, operation) {
  if (operation === 'insert'){
    aliveSockets.push(id);
  } else {
    aliveSockets.splice(aliveSockets.indexOf(id), 1);
  }
  io.emit('participantUpdate', aliveSockets.length);  // broadcast new number of connected sockets
}

function updateRoundSubmissions(id, submission, operation){
  /*
  submission --> [element]
  roundSubmissions --> {id1: submission1, id2: submission2, ...}
  */
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

function getRoundSubmissionsArray(submissions) {
  /*
  submissions --> {id1: array1, id2: array2, ...}
  output --> array1 + array2 + ...
  */
  var output = [];
  for (id in submissions) {
    // include unique submissions only
    if (!output.includes(contentsOf(submissions[id]))){
      output = output.concat(submissions[id]);
    }
  }
  //console.log("Round submission:", output);
  return output;
}

function generateVisualizationFormat(input){
  /*
  input --> {round1: [round1 submissions], round2: [round2 submissions]}
  */
  var visualizationObject = [];
  for (var [round, submissions] of Object.entries(input)) {
    visualizationObject.push(submissions)
  }
  return visualizationObject
}

function endRound(roundSubmissionsArray) {
  io.emit('allSubmissions', {'roundSubmissionsArray': roundSubmissionsArray, 'roundSubmissions': roundSubmissions, 'roundNumber': roundCount+2});
  roundCount += 1;
  submissionsPerRound[roundCount] = roundSubmissionsArray;
  visualizationData.push(roundSubmissionsArray);
  roundSubmissions = {};
  aliveSubmitters = [];
  // end of poll
  if (roundSubmissionsArray.length <= minRemainingHeadlines){
    io.emit('pollClosing', {'roundSubmissionsArray':roundSubmissionsArray, 'numOfRounds':roundCount});
    endPoll(submissionsPerRound);
  }
}

function endPoll(input){
  /*
  input --> {round1: [round1 submissions], round2: [round2 submissions]}
  */
  isPollOver = true;
  roundCount = 0;
  visualizationData.unshift(allInitialHeadlines);
  allInitialHeadlines = [];
  console.log("[num] Visualization data:", mapToIDs(visualizationData));
  console.log("[headlines] Visualization data:", visualizationData);
  var visualizationDataJson = JSON.stringify(mapToIDs(visualizationData));
  fs.writeFileSync('./assets/json/visualizationDataFile.json', visualizationDataJson);
}

io.on('connection', (socket) => {

  if (!aliveSockets.includes(socket.id)) {
    updateAliveSockets(socket.id, 'insert');
    socketToUsername[socket.id] = userNowLoggingIn;
    // console.log("socketToUsername:", socketToUsername);
  }

  socket.emit('roundNumberUpdate', `${roundCount+1}`);

  socket.on('submission', function(submission){
    isPollOver = false;

    if (aliveSubmitters.includes(socket.id)){
      updateRoundSubmissions(socket.id, submission, 'insert');
    } else {
      updateRoundSubmissions(socket.id, submission, 'insert');
      updateAliveSubmitters(socket.id, 'insert');
    }

    roundSubmissionsArray = getRoundSubmissionsArray(roundSubmissions);

    if (aliveSubmitters.length === aliveSockets.length){
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
    delete socketToUsername[socket.id];
  })
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
