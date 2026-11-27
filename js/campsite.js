"use strict";

// Mountain -> Tent
// Mountain -> Fire Pit -> Flame

const TENT_ORANGE = [0.90, 0.45, 0.15];
const STONE_GREY  = [0.45, 0.45, 0.48];
const FLAME_COLOR = [1.00, 0.60, 0.10];

const FIRE_PIT_HEIGHT = 0.25;

// Tent (child of Mountain)
function drawTent(modelMatrix) {
  const tentLocal = mat4.create();
  mat4.translate(tentLocal, tentLocal, [-2.0, MOUNTAIN_TOP, 0.8]);
  mat4.rotateY(tentLocal, tentLocal, 25 * Math.PI / 180);
  mat4.multiply(modelMatrix, modelMatrix, tentLocal);   // world = parent x local
  drawPart(shapes.prism, modelMatrix, [2.2, 1.5, 2.8], TENT_ORANGE);
}

// Fire Pit (child of Mountain)
function drawFirePit(modelMatrix) {
  const firePitLocal = mat4.create();
  mat4.translate(firePitLocal, firePitLocal, [0.6, MOUNTAIN_TOP, 2.4]);
  mat4.multiply(modelMatrix, modelMatrix, firePitLocal);
  drawPart(shapes.cylinder, modelMatrix, [1.1, FIRE_PIT_HEIGHT, 1.1], STONE_GREY);
  pushMatrix(modelMatrix);   // save Fire Pit

    // Flame (child of Fire Pit): sits on top of the stones
    const flameLocal = mat4.create();
    mat4.translate(flameLocal, flameLocal, [0, FIRE_PIT_HEIGHT, 0]);
    mat4.rotateY(flameLocal, flameLocal, 20 * Math.PI / 180);
    mat4.multiply(modelMatrix, modelMatrix, flameLocal);
    drawPart(shapes.cone, modelMatrix, [0.6, 0.9, 0.6], FLAME_COLOR);

  modelMatrix = popMatrix();   // back to Fire Pit
}
