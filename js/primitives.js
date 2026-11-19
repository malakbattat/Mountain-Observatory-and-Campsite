"use strict";
// primitives.js - reusable 3D shapes. Each builder returns { positions: [...], normals: [...] }
// (3 numbers per vertex, 3 vertices per triangle, counter-clockwise when seen from outside).
//
// SHARED SHAPE CONVENTIONS (every component relies on these):
//   cube(), box          1 x 1 x 1, centered on the origin
//   cylinder(seg)        radius 1, axis = Y, from y = 0 to y = 1 (capped)
//   cone(seg)            base radius 1 at y = 0, tip at y = 1 (base capped)
//   sphere(lat, lon)     radius 1, centered on the origin
//   hemisphere(lat, lon) radius 1, upper half (y >= 0), flat base at y = 0 (capped)
//   triangularPrism()    triangle in the XY plane (base width 1 on y = 0, apex at (0,1)),
//                        extruded 1 unit along Z, centered on z = 0  (tent / roof)
//   plane(n)             1 x 1 square on y = 0, facing +Y, centered, split into n x n cells
// Size a shape with the scale argument of drawPart (e.g. a tower: cylinder scaled [1.1, 2.6, 1.1]).

const Primitives = (() => {

  const sub   = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot   = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm  = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  const newData = () => ({ positions: [], normals: [] });

  function pushVertex(d, p, n) { d.positions.push(p[0], p[1], p[2]); d.normals.push(n[0], n[1], n[2]); }

  // Flat-shaded triangle. `center` = a point inside the (convex) shape, used to wind the triangle outward.
  function flatTri(d, a, b, c, center) {
    let g = cross(sub(b, a), sub(c, a));
    if (Math.hypot(g[0], g[1], g[2]) < 1e-9) return;                       // degenerate
    const mid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    if (dot(g, sub(mid, center)) < 0) { const t = b; b = c; c = t; g = [-g[0], -g[1], -g[2]]; }
    const n = norm(g);
    pushVertex(d, a, n); pushVertex(d, b, n); pushVertex(d, c, n);
  }
  function flatQuad(d, a, b, c, e, center) { flatTri(d, a, b, c, center); flatTri(d, a, c, e, center); }

  // Smooth-shaded triangle with per-vertex normals. Winding is fixed to agree with the normals.
  function smoothTri(d, a, b, c, na, nb, nc) {
    const g = cross(sub(b, a), sub(c, a));
    if (Math.hypot(g[0], g[1], g[2]) < 1e-9) return;                       // degenerate (sphere poles)
    const avg = [na[0] + nb[0] + nc[0], na[1] + nb[1] + nc[1], na[2] + nb[2] + nc[2]];
    if (dot(g, avg) < 0) { [b, c] = [c, b]; [nb, nc] = [nc, nb]; }
    pushVertex(d, a, na); pushVertex(d, b, nb); pushVertex(d, c, nc);
  }
  function smoothQuad(d, p, n) {            // p, n = arrays of 4 points / normals in order around the quad
    smoothTri(d, p[0], p[1], p[2], n[0], n[1], n[2]);
    smoothTri(d, p[0], p[2], p[3], n[0], n[2], n[3]);
  }

  function cube() {
    const d = newData(), o = [0, 0, 0];
    const p = [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5],
               [-.5, -.5, -.5], [.5, -.5, -.5], [.5, .5, -.5], [-.5, .5, -.5]];
    const faces = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];
    for (const f of faces) flatQuad(d, p[f[0]], p[f[1]], p[f[2]], p[f[3]], o);
    return d;
  }

  function cylinder(segments = 24) {
    const d = newData();
    const bottom = [0, 0, 0], top = [0, 1, 0], down = [0, -1, 0], up = [0, 1, 0];
    for (let j = 0; j < segments; j++) {
      const a0 = (j / segments) * 2 * Math.PI, a1 = ((j + 1) / segments) * 2 * Math.PI;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const b0 = [c0, 0, s0], b1 = [c1, 0, s1], t0 = [c0, 1, s0], t1 = [c1, 1, s1];
      const n0 = [c0, 0, s0], n1 = [c1, 0, s1];
      smoothQuad(d, [b0, b1, t1, t0], [n0, n1, n1, n0]);   // side (smooth)
      smoothTri(d, bottom, b1, b0, down, down, down);      // bottom cap
      smoothTri(d, top, t0, t1, up, up, up);               // top cap
    }
    return d;
  }

  function cone(segments = 24) {
    const d = newData();
    const base = [0, 0, 0], tip = [0, 1, 0], down = [0, -1, 0];
    for (let j = 0; j < segments; j++) {
      const a0 = (j / segments) * 2 * Math.PI, a1 = ((j + 1) / segments) * 2 * Math.PI;
      const am = (a0 + a1) / 2;
      const b0 = [Math.cos(a0), 0, Math.sin(a0)], b1 = [Math.cos(a1), 0, Math.sin(a1)];
      // side normal of a cone with radius 1 and height 1: (cos, 1, sin) / sqrt(2)
      const n0 = norm([b0[0], 1, b0[2]]), n1 = norm([b1[0], 1, b1[2]]), nt = norm([Math.cos(am), 1, Math.sin(am)]);
      smoothTri(d, b0, b1, tip, n0, n1, nt);
      smoothTri(d, base, b1, b0, down, down, down);
    }
    return d;
  }

  const spherePoint = (theta, phi) => [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)];

  // theta: 0 (top pole) .. maxTheta, phi: 0 .. 2PI around Y. Normal of a unit sphere = position.
  function addSphereBands(d, lat, lon, maxTheta) {
    for (let i = 0; i < lat; i++) {
      const t0 = (i / lat) * maxTheta, t1 = ((i + 1) / lat) * maxTheta;
      for (let j = 0; j < lon; j++) {
        const p0 = (j / lon) * 2 * Math.PI, p1 = ((j + 1) / lon) * 2 * Math.PI;
        const q = [spherePoint(t0, p0), spherePoint(t0, p1), spherePoint(t1, p1), spherePoint(t1, p0)];
        smoothQuad(d, q, q);
      }
    }
  }

  function sphere(lat = 16, lon = 24) {
    const d = newData();
    addSphereBands(d, lat, lon, Math.PI);
    return d;
  }

  function hemisphere(lat = 8, lon = 24) {
    const d = newData();
    addSphereBands(d, lat, lon, Math.PI / 2);
    const down = [0, -1, 0];
    for (let j = 0; j < lon; j++) {                       // flat base
      const p0 = (j / lon) * 2 * Math.PI, p1 = ((j + 1) / lon) * 2 * Math.PI;
      smoothTri(d, [0, 0, 0], spherePoint(Math.PI / 2, p1), spherePoint(Math.PI / 2, p0), down, down, down);
    }
    return d;
  }

  function triangularPrism() {
    const d = newData(), c = [0, 0.33, 0];
    const L = [-.5, 0, .5], R = [.5, 0, .5], A = [0, 1, .5];       // front triangle
    const L2 = [-.5, 0, -.5], R2 = [.5, 0, -.5], A2 = [0, 1, -.5]; // back triangle
    flatTri(d, L, R, A, c);            // front
    flatTri(d, L2, R2, A2, c);         // back
    flatQuad(d, L, A, A2, L2, c);      // left slope
    flatQuad(d, R, R2, A2, A, c);      // right slope
    flatQuad(d, L, L2, R2, R, c);      // floor
    return d;
  }

  function plane(n = 1) {
    const d = newData(), up = [0, 1, 0];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x0 = i / n - 0.5, x1 = (i + 1) / n - 0.5, z0 = j / n - 0.5, z1 = (j + 1) / n - 0.5;
        smoothQuad(d, [[x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [x1, 0, z0]], [up, up, up, up]);
      }
    }
    return d;
  }

  return { cube, cylinder, cone, sphere, hemisphere, triangularPrism, plane };
})();
