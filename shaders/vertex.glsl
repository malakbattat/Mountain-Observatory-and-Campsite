attribute vec3 a_position;
attribute float a_shade;   // brightness of the face

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

varying float v_shade;

void main() {
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_position, 1.0);
  v_shade = a_shade;
}
