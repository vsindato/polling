import React, { useState } from "react";
import logo from "./logo.svg";
import axios from "axios";
import "./App.css";
import Round from "./components/round";
import { ArcherContainer } from "react-archer";
import "./css/round.css";

var numOfRounds = 3;

function App() {
  const [rounds, setRounds] = useState(null);
  const apiURL = "https://school-uniforms.herokuapp.com/vis";

  const fetchData = async () => {
    const response = await axios.get(apiURL);
    console.log("number of rounds are: " + response.data.length);
    setRounds(response.data.reverse());
    if (response.data.length != 0) {
      numOfRounds = response.data.length;
      console.log("test" + numOfRounds);
    }
    document.getElementById("button").style.display = "None";
  };

  return (
    <div className="App">
      <h1>Spread of Misinformation Visualization</h1>
      <button
        id="button"
        className="btn btn-secondary btn-sm"
        onClick={fetchData}
      >
        Make Visualization!
      </button>
      <ArcherContainer strokeColor="black" offset="3">
        <ul
          className="Column"
          style={{
            gridTemplateColumns: generateColumns(numOfRounds),
          }}
        >
          {rounds &&
            rounds.map((round, index) => {
              return (
                <li className="Round" key={index}>
                  {index === 0 ? (
                    <h2>Final</h2>
                  ) : (
                    <h2>Round {rounds.length - index}</h2>
                  )}
                  <Round
                    cards={round}
                    arrowcards={getArrowCards(rounds, index)}
                    roundNo={index + 1}
                  />
                </li>
              );
            })}
        </ul>
      </ArcherContainer>
    </div>
  );
}

function generateColumns(numOfRounds) {
  console.log(numOfRounds);
  console.log("repeat(" + numOfRounds + ", 1fr)");
  return "repeat(" + numOfRounds + ", 1fr)";
}

function getArrowCards(rounds, index) {
  var roundJson = {};
  var answerJson = {};

  if (index == 0) {
    return answerJson;
  }

  for (var i = 0; i < rounds[index - 1].length; i++) {
    roundJson[rounds[index - 1][i]] = true;
  }

  for (var i = 0; i < rounds[index].length; i++) {
    if (roundJson.hasOwnProperty(rounds[index][i])) {
      answerJson[rounds[index][i]] = true;
    }
  }

  return answerJson;
}

export default App;
