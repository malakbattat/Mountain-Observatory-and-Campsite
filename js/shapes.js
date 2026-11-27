"use strict";
// shapes.js: the basic shapes every part is made from.
// Every shape stands on y = 0, its top is at y = 1, and it is 1 unit wide (-0.5 to 0.5),
// so mat4.scale(M, M, [width, height, depth]) gives the real size directly.
// Each face gets a fixed brightness (shade) so the 3D form is visible without lighting.

function addTriangle(shape, a, b, c, shade) {
  shape.pos.push(...a, ...b, ...c);
  shape.shade.push(shade, shade, shade);
}

// a square face = 2 triangles
function addQuad(shape, a, b, c, d, shade) {
  addTriangle(shape, a, b, c, shade);
  addTriangle(shape, a, c, d, shade);
}

function sideShade(angle) {
  return 0.72 + 0.18 * Math.cos(angle - Math.PI / 4);
}

// Cylinder made of "sides" pieces.
// topSize = top width compared to the bottom: 1 = normal cylinder, less than 1 = flat-topped mountain
function buildCylinder(sides, topSize = 1) {
  const cyl = { pos: [], shade: [] };
  const rb = 0.5;
  const rt = 0.5 * topSize;
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * 2 * Math.PI;
    const a1 = ((i + 1) / sides) * 2 * Math.PI;
    const c0 = Math.cos(a0), s0 = Math.sin(a0);
    const c1 = Math.cos(a1), s1 = Math.sin(a1);

    addQuad(cyl, [rb * c0, 0, rb * s0], [rb * c1, 0, rb * s1],
                 [rt * c1, 1, rt * s1], [rt * c0, 1, rt * s0], sideShade((a0 + a1) / 2)); // side
    addTriangle(cyl, [0, 1, 0], [rt * c1, 1, rt * s1], [rt * c0, 1, rt * s0], 1.0);         // top
    addTriangle(cyl, [0, 0, 0], [rb * c0, 0, rb * s0], [rb * c1, 0, rb * s1], 0.5);         // bottom
  }
  return cyl;
}

// Cone: all side triangles meet at the tip
function buildCone(sides) {
  const cone = { pos: [], shade: [] };
  const tip = [0, 1, 0];
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * 2 * Math.PI;
    const a1 = ((i + 1) / sides) * 2 * Math.PI;
    const p0 = [0.5 * Math.cos(a0), 0, 0.5 * Math.sin(a0)];
    const p1 = [0.5 * Math.cos(a1), 0, 0.5 * Math.sin(a1)];

    addTriangle(cone, p0, p1, tip, sideShade((a0 + a1) / 2));  // side
    addTriangle(cone, [0, 0, 0], p0, p1, 0.5);                 // bottom
  }
  return cone;
}

// Prism (tent): a triangle stretched along z
function buildPrism() {
  const prism = { pos: [], shade: [] };
  const FL = [-0.5, 0,  0.5], FR = [0.5, 0,  0.5], FT = [0, 1,  0.5];
  const BL = [-0.5, 0, -0.5], BR = [0.5, 0, -0.5], BT = [0, 1, -0.5];

  addTriangle(prism, FL, FR, FT, 0.85);   // front
  addTriangle(prism, BR, BL, BT, 0.60);   // back
  addQuad(prism, BL, FL, FT, BT, 0.70);   // left roof
  addQuad(prism, FR, BR, BT, FT, 0.95);   // right roof
  addQuad(prism, BL, BR, FR, FL, 0.50);   // floor
  return prism;
}
