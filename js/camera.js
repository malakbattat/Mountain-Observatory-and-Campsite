"use strict";
// camera.js - orbit camera: view matrix + projection matrix + mouse controls.
//
// The camera orbits around `target`. The view matrix moves the world the opposite way:
//   V = T(0,0,-distance) * Rx(pitch) * Ry(yaw) * T(-target)
// yaw   = turn around the scene (Y axis), pitch = look down (positive = from above).

class Camera {
  constructor() {
    this.target   = [0, 4, 0];                 // point the camera looks at (world units)
    this.yaw      = 30 * Math.PI / 180;
    this.pitch    = 18 * Math.PI / 180;
    this.distance = 42;
    this.fov      = Math.PI / 4;               // vertical field of view (radians)
    this.near     = 0.1;
    this.far      = 200;
    this.aspect   = 1;                         // width / height (set by setAspect)
    this.minPitch = 2 * Math.PI / 180;
    this.maxPitch = 85 * Math.PI / 180;
    this.minDistance = 5;
    this.maxDistance = 120;
  }

  setAspect(width, height) { this.aspect = width / Math.max(1, height); }

  getViewMatrix(out = mat4.create()) {
    mat4.identity(out);
    mat4.translate(out, out, [0, 0, -this.distance]);   // step back
    mat4.rotateX(out, out, this.pitch);                 // look down
    mat4.rotateY(out, out, this.yaw);                   // walk around
    mat4.translate(out, out, [-this.target[0], -this.target[1], -this.target[2]]);   // aim at target
    return out;
  }

  getProjectionMatrix(out = mat4.create()) {
    return mat4.perspective(out, this.fov, this.aspect, this.near, this.far);
  }

  // Camera position in world space (useful for later lighting / debugging).
  getPosition() {
    const inv = mat4.invert(mat4.create(), this.getViewMatrix());
    return [inv[12], inv[13], inv[14]];
  }

  // Drag = orbit, wheel = zoom. `onChange` is optional.
  attachMouseControls(canvas, onChange) {
    let dragging = false, lastX = 0, lastY = 0;
    const changed = () => { if (onChange) onChange(); };

    canvas.addEventListener("mousedown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener("mouseup", () => { dragging = false; });
    window.addEventListener("mousemove", e => {
      if (!dragging) return;
      this.yaw   += (e.clientX - lastX) * 0.01;
      this.pitch += (e.clientY - lastY) * 0.01;
      this.pitch = Math.min(this.maxPitch, Math.max(this.minPitch, this.pitch));
      lastX = e.clientX; lastY = e.clientY;
      changed();
    });
    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      this.distance *= (e.deltaY > 0 ? 1.08 : 1 / 1.08);
      this.distance = Math.min(this.maxDistance, Math.max(this.minDistance, this.distance));
      changed();
    }, { passive: false });
  }
}
