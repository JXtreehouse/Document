var container, stats;
var camera, scene, renderer, controls;
var raycaster = new THREE.Raycaster();

var mouse = new THREE.Vector2();
var selectedObjects = [];

var composer, effectFXAA, outlinePass;

function init() {
    composer = new THREE.EffectComposer( renderer );
    
    var renderPass = new THREE.RenderPass( scene, camera );
    composer.addPass( renderPass );
    
    outlinePass = new THREE.OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    composer.addPass( outlinePass );
    
    var onLoad = function ( texture ) {
        
        outlinePass.patternTexture = texture;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
    };
    
    var loader = new THREE.TextureLoader();
    
    loader.load( 'tri_pattern.jpg', onLoad );
    
    effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    effectFXAA.renderToScreen = true;
    composer.addPass( effectFXAA );
}
function add() {
    selectedObjects = [];
    selectedObjects.push( lineGroup );//给选中的线条和物体加发光特效
    selectedObjects.push( intersects[ 0 ].object );
    outlinePass.selectedObjects = selectedObjects;
}