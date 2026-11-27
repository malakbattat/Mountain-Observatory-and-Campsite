"use strict";

// Mountain -> Tower -> Dome -> Telescope

const TOWER_HEIGHT = 2.4;
const DOME_HEIGHT  = 1.1;


const DOME_ANGLE     = 150 * Math.PI / 180;
const TELESCOPE_TILT =  40 * Math.PI / 180;

const TOWER_WHITE    = [0.92, 0.92, 0.90];
const DOME_SILVER    = [0.70, 0.74, 0.80];
const TELESCOPE_GREY = [0.25, 0.27, 0.32];

function drawObservatory(modelMatrix) {
  // Tower (child of Mountain)
  const towerLocal = mat4.create();
  mat4.translate(towerLocal, towerLocal, [2.4, MOUNTAIN_TOP, -1.6]);
  mat4.multiply(modelMatrix, modelMatrix, towerLocal);   // world = parent x local
  drawPart(shapes.cylinder, modelMatrix, [1.6, TOWER_HEIGHT, 1.6], TOWER_WHITE);
  pushMatrix(modelMatrix);   // save Tower

    // Dome (child of Tower): starts at the top of the tower
    const domeLocal = mat4.create();
    mat4.translate(domeLocal, domeLocal, [0, TOWER_HEIGHT, 0]);
    mat4.rotateY(domeLocal, domeLocal, DOME_ANGLE);
    mat4.multiply(modelMatrix, modelMatrix, domeLocal);
    drawPart(shapes.cone, modelMatrix, [1.9, DOME_HEIGHT, 1.9], DOME_SILVER);
    pushMatrix(modelMatrix);   // save Dome

      // Telescope (child of Dome)
      const telescopeLocal = mat4.create();
      mat4.translate(telescopeLocal, telescopeLocal, [0, 0.5, 0]);
      mat4.rotateZ(telescopeLocal, telescopeLocal, -TELESCOPE_TILT);
      mat4.multiply(modelMatrix, modelMatrix, telescopeLocal);
      drawPart(shapes.cylinder, modelMatrix, [0.25, 1.6, 0.25], TELESCOPE_GREY);

    modelMatrix = popMatrix();   // back to Dome
  modelMatrix = popMatrix();     // back to Tower
}
