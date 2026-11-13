const canvas = document.getElementById("gl");
const gl = canvas.getContext("webgl");
if (!gl) {
  alert("WebGL not supported");
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

async function main() {
  const [vsSource, fsSource] = await Promise.all([
    loadText("shaders/vertex.glsl"),
    loadText("shaders/fragment.glsl"),
  ]);

  const program = createProgram(gl, vsSource, fsSource);
  gl.useProgram(program);


  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);


  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);


}

main().catch((err) => console.error(err));