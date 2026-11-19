// Fragment shader (WebGL 1 / GLSL ES 1.00)
// Simple directional light: ambient + diffuse (Lambert), per fragment.
precision mediump float;

uniform vec3  u_color;        // base color of the part
uniform vec3  u_lightDir;     // world-space direction TOWARD the light (normalized)
uniform vec3  u_lightColor;   // light color
uniform vec3  u_ambient;      // ambient light color
uniform float u_brightness;   // global brightness multiplier (1.0 = normal)
uniform float u_unlit;        // 1.0 = ignore lighting (sun, flame, ...), 0.0 = lit

varying vec3 v_normal;

void main() {
  vec3 n = normalize(v_normal);
  float diffuse = max(dot(n, normalize(u_lightDir)), 0.0);
  vec3 lit = u_color * (u_ambient + u_lightColor * diffuse) * u_brightness;
  vec3 rgb = mix(lit, u_color, u_unlit);
  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}
