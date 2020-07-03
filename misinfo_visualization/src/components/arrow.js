import React, { Component } from "react";
import { ArcherContainer, ArcherElement } from "react-archer";

const rootStyle = { display: "flex", justifyContent: "center" };
const rowStyle = {
  margin: "200px 0",
  display: "flex",
  justifyContent: "space-between",
};
const boxStyle = { padding: "10px", border: "1px solid black" };

class Arrow extends Component {
  render() {
    return (
      <div>
        <ArcherContainer strokeColor="red" noCurves="true">
          <div style={rootStyle}>
            <ArcherElement
              id="root"
              relations={[
                {
                  targetId: "element2",
                  targetAnchor: "right",
                  sourceAnchor: "bottom",
                },
              ]}
            >
              <div style={boxStyle}>Root</div>
            </ArcherElement>
          </div>

          <div style={rowStyle}>
            <ArcherElement
              id="element2"
              relations={[
                {
                  targetId: "root",
                  targetAnchor: "left",
                  sourceAnchor: "top",
                  style: { strokeColor: "blue", strokeWidth: 1 },
                },
              ]}
            >
              <div style={boxStyle}>Element 2</div>
            </ArcherElement>
          </div>
        </ArcherContainer>
      </div>
    );
  }
}

export default Arrow;
