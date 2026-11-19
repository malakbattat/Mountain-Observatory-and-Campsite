"use strict";

const GLUtils = {

  // Get the WebGL context from a canvas (throws if unsupported).
  initGL(canvas) {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      alert("WebGL is not supported by this browser.");
      throw new Error("WebGL not supported");
    }
    return gl;
  },

  async loadText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load " + url + " (" + res.status + ")");
    return await res.text();
  },

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("Shader compile failed:\n" + log);
    }
    return shader;
  },

  createProgram(gl, vsSource, fsSource) {
    const vs = GLUtils.createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = GLUtils.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Program link failed:\n" + log);
    }
    return program;
  },

  // Load vertex.glsl + fragment.glsl and build the program.
  async createProgramFromFiles(gl, vsUrl, fsUrl) {
    const [vs, fs] = await Promise.all([GLUtils.loadText(vsUrl), GLUtils.loadText(fsUrl)]);
    return GLUtils.createProgram(gl, vs, fs);
  },

  // Look up attribute and uniform locations by name. Returns { name: location }.
  getLocations(gl, program, attribNames, uniformNames) {
    const loc = {};
    for (const n of attribNames) loc[n] = gl.getAttribLocation(program, n);
    for (const n of uniformNames) loc[n] = gl.getUniformLocation(program, n);
    return loc;
  },

  // Upload { positions: [...], normals: [...] } to the GPU. Returns a mesh handle.
  createMesh(gl, data) {
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.positions), gl.STATIC_DRAW);

    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);

    return { posBuffer, normBuffer, count: data.positions.length / 3 };
  },

  // Bind a mesh to the attributes and draw it as triangles.
  drawMesh(gl, mesh, locs) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuffer);
    gl.vertexAttribPointer(locs.a_position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normBuffer);
    gl.vertexAttribPointer(locs.a_normal, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  },

  // Make the canvas drawing buffer match its on-screen size. Returns true if it changed.
  resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      return true;
    }
    return false;
  },
};
