"use strict";


const canvas = document.getElementById("gl");
const gl = canvas.getContext("webgl");
if (!gl) {
  alert("WebGL not supported on this browser.");
  throw new Error("WebGL not supported");
}


async function loadText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return await res.text();
}

function createShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    throw new Error("Shader compile failed");
  }
  return sh;
}

function createProgram(gl, vsSrc, fsSrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    throw new Error("Program link failed");
  }
  return prog;
}

// ---------- Matrix Stack ----------
const matrixStack = [];
function pushMatrix(matrix) { matrixStack.push(mat4.clone(matrix)); }  // clone: matrices are passed by reference
function popMatrix() { return matrixStack.pop(); }

// Everything on the mountain stands on top of the grass
const MOUNTAIN_TOP = MOUNTAIN_HEIGHT + GRASS_THICKNESS;

const shapes = {};
let aPosition, aShade, uModel, uView, uProj, uColor;

function uploadShape(data) {
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.pos), gl.STATIC_DRAW);

  const shadeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, shadeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.shade), gl.STATIC_DRAW);

  return { posBuffer, shadeBuffer, count: data.pos.length / 3 };
}

// Draws one part:  M = Parent x Local x S   (Local = T x R)
// The scale is applied to a COPY, so it is not passed down to the children.
function drawPart(shape, modelMatrix, size, color) {
  const M = mat4.clone(modelMatrix);
  mat4.scale(M, M, size);
  gl.uniformMatrix4fv(uModel, false, M);
  gl.uniform3fv(uColor, color);

  gl.bindBuffer(gl.ARRAY_BUFFER, shape.posBuffer);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, shape.shadeBuffer);
  gl.vertexAttribPointer(aShade, 1, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, shape.count);
}

function setCamera() {
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

  // View matrix = inverse of the camera's own matrix
  const cameraMatrix = mat4.create();
  mat4.translate(cameraMatrix, cameraMatrix, [0, 10, 17]);
  mat4.rotateX(cameraMatrix, cameraMatrix, -15 * Math.PI / 180);
  const viewMatrix = mat4.create();
  mat4.invert(viewMatrix, cameraMatrix);

  gl.uniformMatrix4fv(uProj, false, projectionMatrix);
  gl.uniformMatrix4fv(uView, false, viewMatrix);
}

function drawScene() {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.60, 0.80, 0.95, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // ROOT: Mountain (its local matrix is the identity, so it is also its world matrix)
  let modelMatrix = mat4.create();
  drawMountain(modelMatrix);

  // Children of the Mountain: push saves the Mountain matrix, pop restores it for the next child
  pushMatrix(modelMatrix);  drawGrassTop(modelMatrix);     modelMatrix = popMatrix();
  pushMatrix(modelMatrix);  drawObservatory(modelMatrix);  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);  drawTent(modelMatrix);         modelMatrix = popMatrix();
  pushMatrix(modelMatrix);  drawFirePit(modelMatrix);      modelMatrix = popMatrix();
  pushMatrix(modelMatrix);  drawSky(modelMatrix);          modelMatrix = popMatrix();
}

async function main() {
  const [vs, fs] = await Promise.all([loadText("shaders/vertex.glsl"), loadText("shaders/fragment.glsl")]);
  const program = createProgram(gl, vs, fs);
  gl.useProgram(program);

  aPosition = gl.getAttribLocation(program, "a_position");
  aShade    = gl.getAttribLocation(program, "a_shade");
  gl.enableVertexAttribArray(aPosition);
  gl.enableVertexAttribArray(aShade);

  uModel = gl.getUniformLocation(program, "u_ModelMatrix");
  uView  = gl.getUniformLocation(program, "u_ViewMatrix");
  uProj  = gl.getUniformLocation(program, "u_ProjectionMatrix");
  uColor = gl.getUniformLocation(program, "u_color");

  shapes.cylinder = uploadShape(buildCylinder(12));
  shapes.cone     = uploadShape(buildCone(12));
  shapes.prism    = uploadShape(buildPrism());
  shapes.mountain = uploadShape(buildCylinder(12, MOUNTAIN_TOP_SIZE));

  gl.enable(gl.DEPTH_TEST);
  setCamera();
  drawScene();  
}

main().catch(err => console.error(err));
