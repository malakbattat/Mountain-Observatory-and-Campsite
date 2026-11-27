precision mediump float;

uniform vec3 u_color;   // one color per part
varying float v_shade;

void main() {
  gl_FragColor = vec4(u_color * v_shade, 1.0);
}
