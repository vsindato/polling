import React, { Component } from "react";
import "../css/round.css";
import { ArcherElement } from "react-archer";

var headlineJson = require("../allHeadlines.json");

class Round extends Component {
  render() {
    return (
      <div>
        {this.props.cards.map((card, index) => (
          <div key={index}>
            <div className={this.getCardClasses(card)}>
              {this.getHeadline(card)}
              <ArcherElement id={this.makeCurrentID(this.props.roundNo, card)}>
                <div className="arrowEnd"></div>
              </ArcherElement>

              {this.isArrow(this.props.arrowcards, card) ? (
                <ArcherElement
                  id={this.makeArrowID(this.props.roundNo, card)}
                  relations={this.generateRelations(this.props.roundNo, card)}
                >
                  <div className="arrowEnd"></div>
                </ArcherElement>
              ) : (
                <div></div>
              )}
            </div>
            <div className="caption">{this.getMisinfoTactic(card)}</div>
          </div>
        ))}
      </div>
    );
  }

  getHeadline(card) {
    if (card != null) {
      return headlineJson[card]["headline"];
    } else {
      return "Empty Turn";
    }
  }

  getMisinfoTactic(card) {
    if (card != null) {
      return headlineJson[card]["tactic"];
    } else {
      return "";
    }
  }

  isArrow(arrowcards, card) {
    return arrowcards.hasOwnProperty(card);
  }

  generateRelations(round, headlineId) {
    var reljson = {
      targetAnchor: "left",
      sourceAnchor: "right",
    };
    reljson.targetId = this.makePrevID(round, headlineId);
    return [reljson];
  }

  makeArrowID(round, headlineId) {
    let id = "arrow-" + round + "-" + headlineId;
    return id;
  }

  makePrevID(round, headlineId) {
    let id = "round-" + (round - 1) + "-" + headlineId;
    return id;
  }

  makeCurrentID(round, headlineId) {
    let id = "round-" + round + "-" + headlineId;
    return id;
  }

  getCardClasses(card) {
    if (card != null) {
      let classes = "card ";
      classes +=
        headlineJson[card]["isMisinfo"] == "Misinfo" ? "misinfo" : "neutral";
      return classes;
    } else {
      return "card null";
    }
  }
}

export default Round;
