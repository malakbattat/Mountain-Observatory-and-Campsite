"use strict";
// main.js - WebGL setup, shared drawing interface, and the main rendering loop.
//
// ===================== TEAM CONVENTIONS (agree on these first) =====================
// Coordinates : right-handed, +Y is UP, ground plane = XZ, 1 unit = 1 world unit.
// Angles      : radians. rotateY > 0 turns counter-clockwise seen from above.
// Transforms  : M = T * R * S. A part is placed with stack.translate / rotate, and sized
//               by the `size` argument of ctx.drawPart. Size is applied to a COPY of the
//               matrix, so children never inherit their parent's shape size.
// Hierarchy   : stack.push() ... stack.pop(). A component must leave the stack at the
//               same depth it found it. On entry, stack.current = the parent's matrix.
// Shapes      : see the header of js/primitives.js (all sizes/origins are listed there).
// Colors      : [r, g, b] in 0..1.
//
// ===================== COMPONENT INTERFACE =====================
// A component is a function  drawXxx(ctx)  that draws one part of the scene
// (and its children). Add it to the COMPONENTS list below.
//   ctx.stack       MatrixStack          (push / pop / translate / rotateX|Y|Z / scale)
//   ctx.drawPart(meshName, [sx,sy,sz], [r,g,b], { unlit: true })   draws a primitive
//   ctx.meshes      names: cube cylinder cone sphere hemisphere prism plane
//   ctx.time        seconds since start      ctx.dt  seconds since last frame
//   ctx.camera, ctx.lighting, ctx.gl
// ================================================================

const COMPONENTS = [
  drawDemoScene,      // test scene - DELETE this line (and the function below) when real components exist
  // drawTerrain, drawTrees, drawCampsite, drawObservatory, drawSky,
];

const canvas = document.getElementById("glCanvas");
const gl = GLUtils.initGL(canvas);

const stack    = new MatrixStack();
const camera   = new Camera();
const lighting = new Lighting();
const meshes   = {};                 // name -> GPU mesh
let locs = null;                     // shader locations
let lastTime = 0;

// ---------- shared drawing interface ----------
// Draw a primitive in the CURRENT coordinate system of the stack.
function drawPart(meshName, size, color, options = {}) {
  const mesh = meshes[meshName];
  if (!mesh) throw new Error("Unknown mesh: " + meshName);

  const M = mat4.clone(stack.current);                  // copy: the caller's matrix stays unscaled
  mat4.scale(M, M, size);
  gl.uniformMatrix4fv(locs.u_ModelMatrix, false, M);
  gl.uniformMatrix3fv(locs.u_NormalMatrix, false, mat3.normalFromMat4(mat3.create(), M));
  gl.uniform3fv(locs.u_color, color);
  gl.uniform1f(locs.u_unlit, options.unlit ? 1.0 : 0.0);
  GLUtils.drawMesh(gl, mesh, locs);
}

// ---------- TEST COMPONENT (shows every primitive + a parent/child chain) ----------
function drawDemoScene(ctx) {
  const { stack, drawPart, time } = ctx;

  // ground
  drawPart("plane", [40, 1, 40], [0.35, 0.55, 0.30]);

  // row of all primitives
  const row = [["cube", [2, 2, 2], [0.8, 0.3, 0.3]], ["cylinder", [1, 2.5, 1], [0.3, 0.5, 0.8]],
               ["cone", [1.2, 2.5, 1.2], [0.2, 0.6, 0.3]], ["sphere", [1.2, 1.2, 1.2], [0.9, 0.8, 0.3]],
               ["hemisphere", [1.5, 1.5, 1.5], [0.7, 0.4, 0.8]], ["prism", [2.5, 2, 2.5], [0.8, 0.6, 0.4]]];
  row.forEach((r, i) => {
    stack.push();
    stack.translate(-12.5 + i * 5, r[0] === "sphere" ? 1.2 : r[0] === "cube" ? 1 : 0, -8);
    drawPart(r[0], r[1], r[2]);
    stack.pop();
  });

  // hierarchy test: tower -> dome (rotates) -> telescope (tilts) - the telescope must follow the dome
  stack.push();
    stack.translate(0, 0, 4);
    drawPart("cylinder", [2, 5, 2], [0.9, 0.88, 0.82]);                 // tower
    stack.push();
      stack.translate(0, 5, 0);
      stack.rotateY(time * 0.6);                                          // dome turns
      drawPart("hemisphere", [2.4, 2.4, 2.4], [0.75, 0.8, 0.86]);
      stack.push();
        stack.translate(0, 0.9, 0);
        stack.rotateX(0.9 + 0.2 * Math.sin(time));                        // telescope tilts
        drawPart("cylinder", [0.3, 3, 0.3], [0.25, 0.27, 0.34]);
      stack.pop();
    stack.pop();
  stack.pop();

  // unlit test (glowing sphere orbiting the tower)
  stack.push();
    stack.translate(0, 8, 4);
    stack.rotateZ(time * 0.5);
    stack.translate(10, 0, 0);
    drawPart("sphere", [1, 1, 1], [1.0, 0.9, 0.4], { unlit: true });
  stack.pop();
}

// ---------- main loop ----------
function render(nowMs) {
  const time = nowMs / 1000;
  const dt = lastTime ? time - lastTime : 0;
  lastTime = time;

  if (GLUtils.resizeCanvasToDisplaySize(canvas)) gl.viewport(0, 0, canvas.width, canvas.height);
  camera.setAspect(canvas.width, canvas.height);

  gl.clearColor(0.53, 0.78, 0.95, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(locs.u_ViewMatrix, false, camera.getViewMatrix());
  gl.uniformMatrix4fv(locs.u_ProjectionMatrix, false, camera.getProjectionMatrix());
  lighting.apply(gl, locs);

  stack.reset();                                              // every frame starts at the root (identity)
  const ctx = { gl, stack, drawPart, meshes, camera, lighting, time, dt };
  for (const draw of COMPONENTS) {
    const depth = stack.depth;
    draw(ctx);
    if (stack.depth !== depth) console.warn("Unbalanced push/pop in", draw.name);
  }
  requestAnimationFrame(render);
}

async function main() {
  const program = await GLUtils.createProgramFromFiles(gl, "vertex.glsl", "fragment.glsl");
  gl.useProgram(program);

  locs = GLUtils.getLocations(gl, program,
    ["a_position", "a_normal"],
    ["u_ModelMatrix", "u_ViewMatrix", "u_ProjectionMatrix", "u_NormalMatrix",
     "u_color", "u_unlit", "u_lightDir", "u_lightColor", "u_ambient", "u_brightness"]);
  gl.enableVertexAttribArray(locs.a_position);
  gl.enableVertexAttribArray(locs.a_normal);

  // Build every primitive once; all components reuse them.
  meshes.cube       = GLUtils.createMesh(gl, Primitives.cube());
  meshes.cylinder   = GLUtils.createMesh(gl, Primitives.cylinder(24));
  meshes.cone       = GLUtils.createMesh(gl, Primitives.cone(24));
  meshes.sphere     = GLUtils.createMesh(gl, Primitives.sphere(16, 24));
  meshes.hemisphere = GLUtils.createMesh(gl, Primitives.hemisphere(8, 24));
  meshes.prism      = GLUtils.createMesh(gl, Primitives.triangularPrism());
  meshes.plane      = GLUtils.createMesh(gl, Primitives.plane(1));

  gl.enable(gl.DEPTH_TEST);
  camera.distance = 32;                 // closer than the default so the demo fills the view
  camera.attachMouseControls(canvas);
  requestAnimationFrame(render);
}

main().catch(err => { console.error(err); alert(err.message); });
