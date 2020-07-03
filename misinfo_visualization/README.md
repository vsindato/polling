## Directions on how to load visualization

First, run Victor's backend locally.
My visualization currently relies on a json object fetched from http://localhost:5000/vis (which means the server needs to be running).

1. cd misinformation
2. npm start

Then, run my visualization front end.

1. cd misinfo_visualization
2. npm start

This will automatically open up a browser window navigated to localhost:3000, which will display my current visualization.

Note:

As of right now, I hard coded in the data that would be fetched from http://localhost:5000/vis. You can see this in server.js (found in the misinformation directory). This will be changed to dynamically send the appropriate data later on.

Additionally, in App.js (found in the misinfo_visualization directory), you can see that the api URL I fetch from is http://localhost:5000/vis. This will change later to the URL of the appropriate webpage once the polling game is deployed.
