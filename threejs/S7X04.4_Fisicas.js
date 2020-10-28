/**
 * Seminario GPC #4  Animación por simulación física.
 * Esferas en habitación cerrada con molinete central
 * 
 * @requires three_r96.js, coordinates.js, orbitControls.js, cannon.js, tween.js, stats_r16.js
 * @author rvivo / http://personales.upv.es/rvivo
 * @date 2020
 */

// Globales convenidas por threejs
var renderer, scene, camera;
// Control de camara
var cameraControls;
// Monitor de recursos
var stats;
// Mundo fisico
var world, reloj;
// Objetos
var hero;
var groundVisual;



initPhysicWorld();
initVisualWorld();
loadWorld();
render();




/**
 * Construye una bola con cuerpo y vista
 */
function hero( radio, posicion, material ){
	var masa = 1;
	this.body = new CANNON.Body( {mass: masa, material: material} );
	this.body.addShape( new CANNON.Sphere( radio ) );
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.SphereGeometry( radio ), 
		          new THREE.MeshBasicMaterial( {wireframe: true } ) );
	this.visual.position.copy( this.body.position );
}

/**
 * Inicializa el mundo fisico con un
 * suelo y cuatro paredes de altura infinita
 */
function initPhysicWorld()
{
	// Mundo 
  	world = new CANNON.World(); 
   	world.gravity.set(0,-9.8,0); 
   	///world.broadphase = new CANNON.NaiveBroadphase(); 
   	world.solver.iterations = 10; 

   	// Material y comportamiento
    var groundMaterial = new CANNON.Material("groundMaterial");
    var materialEsfera = new CANNON.Material("sphereMaterial");
    world.addMaterial( materialEsfera );
    world.addMaterial( groundMaterial );
    // -existe un defaultContactMaterial con valores de restitucion y friccion por defecto
    // -en caso que el material tenga su friccion y restitucion positivas, estas prevalecen 
    var sphereGroundContactMaterial = new CANNON.ContactMaterial(groundMaterial,materialEsfera,
    										    				{ friction: 0.3, // Friccion
    										      				  restitution: 0.7 });	//rebote
    world.addContactMaterial(sphereGroundContactMaterial);

    // Suelo
    var groundShape = new CANNON.Plane();
    var ground = new CANNON.Body({ mass: 0, material: groundMaterial });	// Mass 0 no le afectan las fuerzas
    ground.addShape(groundShape);
    ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(ground);




}

/**
 * Inicializa la escena visual
 */
function initVisualWorld()
{
	// Inicializar el motor de render
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( new THREE.Color(0x000000) );
	document.getElementById( 'container' ).appendChild( renderer.domElement );

	// Crear el grafo de escena
	scene = new THREE.Scene();

	// Reloj
	reloj = new THREE.Clock();
	reloj.start();

	// Crear y situar la camara
	var aspectRatio = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera( 75, aspectRatio , 0.1, 100 );
	camera.position.set( 2,5,10 );
	camera.lookAt( new THREE.Vector3( 0,0,0 ) );
	// Control de camara
	cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
	cameraControls.target.set(0,0,0);

	// STATS --> stats.update() en update()
	stats = new Stats();
	stats.showPanel(0);	// FPS inicialmente. Picar para cambiar panel.
	document.getElementById( 'container' ).appendChild( stats.domElement );

    var geometry = new THREE.PlaneGeometry(100, 4000, 10, 10);
    var material = new THREE.MeshBasicMaterial( { color: 'white', side: THREE.DoubleSide, wireframe:false})

    ground = new THREE.Mesh( geometry, material);
    ground.rotation.x = Math.PI / 2
    scene.add(ground);
	// Callbacks
	window.addEventListener('resize', updateAspectRatio );
}

/**
 * Carga los objetos es el mundo físico y visual
 */
function loadWorld()
{
	// Genera las esferas
	var materialEsfera;
	for( i=0; i<world.materials.length; i++){
		if( world.materials[i].name === "sphereMaterial" ) materialEsfera = world.materials[i];
	}
	hero = new hero( 1/2, new CANNON.Vec3( -1, 2, 0 ), materialEsfera );
	world.addBody(hero.body);
	scene.add(hero.visual);

	// Suelo
	Coordinates.drawGrid({size:10,scale:1, orientation:"x"});

	scene.add( new THREE.AxisHelper(5 ) );
}

/**
 * Isotropía frente a redimension del canvas
 */
function updateAspectRatio()
{
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
}

/**
 * Actualizacion segun pasa el tiempo
 */
function update()
{
	var segundos = reloj.getDelta();	// tiempo en segundos que ha pasado
	world.step( segundos );				// recalcula el mundo tras ese tiempo
	//hero.body.position.x += 1;
	hero.visual.position.copy(hero.body.position );
	hero.visual.quaternion.copy( hero.body.quaternion );

	// Actualiza el monitor 
	stats.update();

	// Actualiza el movimeinto del molinete
	TWEEN.update();
}

/**
 * Update & render
 */
function render()
{
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
}