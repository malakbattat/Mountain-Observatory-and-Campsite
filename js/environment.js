"use strict";

// Mountain (ROOT) -> Grass Top
// Mountain (ROOT) -> Sun -> Moon

const MOUNTAIN_ROCK = [0.50, 0.44, 0.38];
const GRASS_GREEN   = [0.36, 0.62, 0.30];
const SUN_YELLOW    = [1.00, 0.85, 0.20];
const MOON_WHITE    = [0.95, 0.95, 0.88];

const MOUNTAIN_WIDTH    = 30;
const MOUNTAIN_HEIGHT   = 5;
const MOUNTAIN_TOP_SIZE = 0.4;   // top is 40% of the bottom width
const GRASS_THICKNESS   = 0.1;

const SKY_RADIUS = 7;
const SUN_ANGLE  = 35 * Math.PI / 180;   

// Mountain (ROOT): identity matrix, the center of the world
function drawMountain(modelMatrix) {
  drawPart(shapes.mountain, modelMatrix, [MOUNTAIN_WIDTH, MOUNTAIN_HEIGHT, MOUNTAIN_WIDTH], MOUNTAIN_ROCK);
}

// Grass Top (child of Mountain)
function drawGrassTop(modelMatrix) {
  const grassLocal = mat4.create();
  mat4.translate(grassLocal, grassLocal, [0, MOUNTAIN_HEIGHT, 0]);
  mat4.multiply(modelMatrix, modelMatrix, grassLocal);   // world = parent x local
  const grassWidth = MOUNTAIN_WIDTH * MOUNTAIN_TOP_SIZE - 0.6;   // a bit smaller -> rocky edge
  drawPart(shapes.cylinder, modelMatrix, [grassWidth, GRASS_THICKNESS, grassWidth], GRASS_GREEN);
}

// Disc = short cylinder turned to face the camera.
// We turn a COPY so the turn does not affect the children (the Moon).
function drawDisc(modelMatrix, diameter, color) {
  const M = mat4.clone(modelMatrix);
  mat4.rotateX(M, M, Math.PI / 2);
  drawPart(shapes.cylinder, M, [diameter, 0.2, diameter], color);
}

// Sun (child of Mountain) and Moon (child of Sun)
function drawSky(modelMatrix) {
  // Sun: local = T(circle center) x R(angle) x T(radius)
  const sunLocal = mat4.create();
  mat4.translate(sunLocal, sunLocal, [0, MOUNTAIN_TOP, -6]);
  mat4.rotateZ(sunLocal, sunLocal, SUN_ANGLE);
  mat4.translate(sunLocal, sunLocal, [SKY_RADIUS, 0, 0]);
  mat4.multiply(modelMatrix, modelMatrix, sunLocal);
  drawDisc(modelMatrix, 1.4, SUN_YELLOW);
  pushMatrix(modelMatrix);   // save Sun

    // Moon: back to the center, turn 90 degrees more, go out again
    const moonLocal = mat4.create();
    mat4.translate(moonLocal, moonLocal, [-SKY_RADIUS, 0, 0]);
    mat4.rotateZ(moonLocal, moonLocal, Math.PI / 2);
    mat4.translate(moonLocal, moonLocal, [SKY_RADIUS, 0, 0]);
    mat4.multiply(modelMatrix, modelMatrix, moonLocal);
    drawDisc(modelMatrix, 1.0, MOON_WHITE);

  modelMatrix = popMatrix();   // back to Sun
}
