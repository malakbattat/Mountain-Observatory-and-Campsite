// Vertex shader (WebGL 1 / GLSL ES 1.00)
// gl_Position = Projection * View * Model * position
attribute vec3 a_position;        // vertex position in the shape's own (local) space
attribute vec3 a_normal;          // vertex normal in the shape's own space

uniform mat4 u_ModelMatrix;       // local -> world (from the matrix stack, scale included)
uniform mat4 u_ViewMatrix;        // world -> camera
uniform mat4 u_ProjectionMatrix;  // camera -> clip space
uniform mat3 u_NormalMatrix;      // inverse-transpose of the model matrix (keeps normals correct under scaling)

varying vec3 v_normal;            // world-space normal, interpolated per fragment

void main() {
  v_normal = u_NormalMatrix * a_normal;
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_position, 1.0);
}
