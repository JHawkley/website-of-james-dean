uniform mat3 u_camera;

attribute vec2 a_position;
attribute vec4 a_color;

varying vec4 v_color;

void main() {
    v_color = a_color;
    vec3 new_pos = u_camera * vec3(a_position, 1.0);
    gl_Position = vec4(new_pos.xy, 0.0, 1.0);
}