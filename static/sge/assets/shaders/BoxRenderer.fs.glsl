// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

varying vec4 v_color;

void main() {
    gl_FragColor = v_color;
}