"use strict";
// Directions are in WORLD space. `direction` points TOWARD the light.

class Lighting {
  constructor() {
    this.direction  = [0.5, 0.8, 0.6];       // toward the light (normalized in setDirection)
    this.color      = [0.75, 0.75, 0.70];    // diffuse light color
    this.ambient    = [0.35, 0.35, 0.40];    // ambient color
    this.brightness = 1.0;                   // global multiplier (day/night later)
    this.setDirection(this.direction);
  }

  setDirection(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    this.direction = [v[0] / len, v[1] / len, v[2] / len];
  }

  // Upload the light to the shader (call once per frame; the program must be in use).
  apply(gl, locs) {
    gl.uniform3fv(locs.u_lightDir, this.direction);
    gl.uniform3fv(locs.u_lightColor, this.color);
    gl.uniform3fv(locs.u_ambient, this.ambient);
    gl.uniform1f(locs.u_brightness, this.brightness);
  }
}
