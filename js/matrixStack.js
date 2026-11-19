"use strict";
// matrixStack.js - hierarchical transformations (push / pop).
//
// Usage (parent -> child):
//   stack.push();                    // save the parent's matrix
//     stack.translate(0, 2, 0);      // M = M_parent * T
//     stack.rotateY(angle);          // M = M_parent * T * R
//     drawPart(...);                 // shape scale is applied inside drawPart, not here
//children are drawn here, they start from this matrix
//   stack.pop();                     // back to the parent
//
// Every transform method multiplies on the RIGHT (local space), so the last call
// is applied to the vertices first:  M = T * R * S.

class MatrixStack {
  constructor() {
    this._stack = [];
    this._current = mat4.create();   // identity
  }

  // The live current matrix (do not keep a reference across push/pop; clone it if needed).
  get current() { return this._current; }

  get depth() { return this._stack.length; }

  // Save a copy of the current matrix. (clone: gl-matrix matrices are passed by reference)
  push() {
    this._stack.push(mat4.clone(this._current));
    return this;
  }

  // Restore the last saved matrix.
  pop() {
    if (this._stack.length === 0) throw new Error("MatrixStack.pop(): stack is empty (unbalanced push/pop)");
    this._current = this._stack.pop();
    return this;
  }

  // Back to identity and empty the stack. Call at the start of every frame.
  reset() {
    this._stack.length = 0;
    mat4.identity(this._current);
    return this;
  }

  translate(x, y, z) { mat4.translate(this._current, this._current, [x, y, z]); return this; }
  rotateX(rad)       { mat4.rotateX(this._current, this._current, rad); return this; }
  rotateY(rad)       { mat4.rotateY(this._current, this._current, rad); return this; }
  rotateZ(rad)       { mat4.rotateZ(this._current, this._current, rad); return this; }
  scale(x, y, z)     { mat4.scale(this._current, this._current, [x, y, z]); return this; }
  multiply(m)        { mat4.multiply(this._current, this._current, m); return this; }
}
