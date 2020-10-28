
// Globales convenidas por threejs
var renderer, scene, camera;
// Control de camara
var cameraControls;
// Monitor de recursos
var stats;
// Mundo fisico
var world, clock;
// Objetos
var materialEsfera, woodMaterial, animalMaterial;

// Posiciones para los ciervos
var deerpositions = [-1700, -1100, -500, 0, 800, 1800]
var text;
var hero;
var score, highscore = 0;
var groundVisual;
var jumping = false;
var onGround = true;
var movingRight = false;
var movingLeft = false;
var accelerating = false;
var arrowUp = 38;
var arrowDown = 40;
var arrowLeft = 37;
var arrowRight = 39;
var space = 32;
var speed = 1000;
var maxSpeed = 4002;
var xSpeed = 20;             // Para el movimiento lateral
var maxX = 20;
var minX = -20;
var rotateSpeed = 1;
var jumpForce = 80;
var nWoods = 1;
var nAnimals = 4;
var woods = [];
var animals = [];
var maxRotation = Math.PI;
var deltaTime = 0;
var totalTime = 0;
var before = Date.now();
var angle = 0;
var group;              // Para el grafo de escena, camara y el 'heroe'
var finish = false;
var fogNear = 100;
var fogFar = 400;
initPhysicWorld();
initVisualWorld();
setupGui();
loadWorld();
render();




/**
 * Construye una bola con cuerpo y vista
 */
function hero( radio, posicion, material ){
    var masa = 10;
    this.body = new CANNON.Body( {mass: masa, material: material} );
    this.body.addShape( new CANNON.Sphere( radio, 50, 50 ) );
    this.body.position.copy( posicion );
    this.visual = new THREE.Mesh( new THREE.SphereGeometry( radio, 50, 50 ), 
                  material );
    this.visual.castShadow = true;
    this.visual.receiveShadow = true;
    this.visual.position.copy( this.body.position );
}

/**
 * Construye un cilindro
 */
function wood(posicion, material ){
    var masa = 0;
    this.body = new CANNON.Body( {mass: masa, material: material} );
    this.body.addShape( new CANNON.Cylinder( 2, 2, 10, 10 ) );
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,0,1),-Math.PI/2);
    this.body.position.copy( posicion );
    this.visual = new THREE.Mesh( new THREE.CylinderGeometry( 2, 2, 10, 10 ), 
                  material );
    this.visual.castShadow = true;
    this.visual.receiveShadow = true;
    this.visual.rotation.x = -Math.PI/2;
    this.visual.rotation.z = -Math.PI/2;
    this.visual.position.copy( this.body.position );
}

/**
 * Construye un cilindro
 */
function animal(posicion, material ){
    var masa = 0;
    this.body = new CANNON.Body( {mass: masa, material: material} );
    this.body.addShape( new CANNON.Box( new CANNON.Vec3(4,4, 4)) );
    this.body.position.copy( posicion );
    this.visual = new THREE.Mesh( new THREE.BoxGeometry( 4,4, 2 ), 
                  material );
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
    world.solver.iterations = 10; 

    // Material y comportamiento
    var groundMaterial = new CANNON.Material("groundMaterial");
    var materialEsfera = new CANNON.Material("sphereMaterial");
    var woodMaterial = new CANNON.Material("woodMaterial");
    var animalMaterial = new CANNON.Material("animalMaterial");
    world.addMaterial( materialEsfera );
    world.addMaterial( groundMaterial );
    world.addMaterial( woodMaterial );
    // -existe un defaultContactMaterial con valores de restitucion y friccion por defecto
    // -en caso que el material tenga su friccion y restitucion positivas, estas prevalecen 
    var sphereGroundContactMaterial = new CANNON.ContactMaterial(groundMaterial,materialEsfera,
                                                                { friction: 0.3, // Friccion
                                                                  restitution: 0 });  //rebote
    var sphereWoodContactMaterial = new CANNON.ContactMaterial(woodMaterial,materialEsfera,
                                                                { friction: 0.3, // Friccion
                                                                  restitution: 5 });  //rebote
    var sphereAnimalContactMaterial = new CANNON.ContactMaterial(animalMaterial,materialEsfera,
                                                                { friction: 0.3, // Friccion
                                                                  restitution: 3 });  //rebote


    world.addContactMaterial(sphereGroundContactMaterial);
    world.addContactMaterial(sphereWoodContactMaterial);
    world.addContactMaterial(sphereAnimalContactMaterial);
    // Suelo
    var groundShape = new CANNON.Plane();
    var ground = new CANNON.Body({ mass: 0, material: groundMaterial });    // Mass 0 no le afectan las fuerzas
    ground.addShape(groundShape);
    ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(ground);
    // Paredes

    var leftWall = new CANNON.Body( {mass:0, material:groundMaterial} );
    leftWall.addShape( new CANNON.Plane() );
    leftWall.position.x -= 20;
    leftWall.quaternion.setFromEuler(0,Math.PI/2,0,'XYZ');
    world.addBody( leftWall );
    var rightWall = new CANNON.Body( {mass:0, material:groundMaterial} );
    rightWall.addShape( new CANNON.Plane() );
    rightWall.position.x += 20;
    rightWall.quaternion.setFromEuler(0,-Math.PI/2,0,'XYZ');
    world.addBody( rightWall );

    var backWall = new CANNON.Body( {mass:0, material:groundMaterial} );
    backWall.addShape( new CANNON.Plane() );
    backWall.position.z -= 2050;
    backWall.quaternion.setFromEuler(0,0,0,'XYZ');
    world.addBody( backWall );


}


/**
 * Inicializa la escena visual
 */
function initVisualWorld()
{
    
    // Inicializar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    // Hacer que el motor calcule sombras
	renderer.shadowMap.enabled = true;
    document.getElementById( 'container' ).appendChild( renderer.domElement );
    
    // Crear el grafo de escena
    scene = new THREE.Scene();

    // Reloj
    clock = new THREE.Clock();
    clock.start();
    var ar = window.innerWidth / window.innerHeight;
    setCameras(ar);

    // STATS --> stats.update() en update()
    stats = new Stats();
    stats.showPanel(0); // FPS inicialmente. Picar para cambiar panel.

    document.getElementById( 'container' ).appendChild( stats.domElement );

    
    // Luces
    var pointLight = new THREE.PointLight(0xFFFFFF, 0.5);   
    pointLight.position.set( 10, 10, -10);
    scene.add(pointLight);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight.position.set(-10, 5, 10);
    scene.add(directionalLight);

    var spotLight = new THREE.SpotLight(0xFFFFFF, 0.8);
    spotLight.position.set(0, 5000, 2000);
    spotLight.target.position.set(0, 0, 0);
    spotLight.angle = Math.PI/7;
    spotLight.penumbra = 0.2;
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 1000;
    spotLight.shadow.camera.fov = 10;
    scene.add(spotLight);

    scene.fog = new THREE.Fog(0xFFFFFF, fogNear, fogFar);

    // Callbacks
    window.addEventListener('resize', updateAspectRatio );
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}


function setCameras(ar){

    camera = new THREE.PerspectiveCamera( 50, ar , 0.1, 500 );
    camera.position.set( 0, 20, 2050 );
    camera.lookAt(0, 0, 0);

    scene.add(camera);

     // ¿Necesario?
    //cameraControls = new THREE.OrbitControls( minimap, renderer.domElement );
    //cameraControls.target.set( 0, 0, 0 );
   
}

function setupGui()
{
	// Definicion de los controles
	effectController = {
		reiniciar: function(){
            scene.remove(score);
            hero.body.position.z = 1975;
            hero.body.position.x = 0;   
            hero.body.position.y = 3;
            hero.body.velocity.z = 0;
            hero.body.velocity.x = 0;
            hero.body.velocity.y = 0;
            hero.body.angularVelocity.z = 0;
            hero.body.angularVelocity.x = 0;
            hero.body.angularVelocity.y = 0;
            scoreShowed = false;
            accelerating = false;
            totalTime = 0;
            finish = false;
            scene.remove(text);
		},
	};

	// Creacion interfaz
	var gui = new dat.GUI();

	// Construccion del menu
	var h = gui.addFolder("Menu");
	h.add(effectController, "reiniciar").name("Reiniciar");
}


/**
 * Carga los objetos es el mundo físico y visual
 */
function loadWorld()
{
    // Texturas
    var path = "images/";
    var floorTexture = new THREE.TextureLoader().load(path + 'tierra.jpg');
    floorTexture.magFilter = THREE.LinearFilter;
    floorTexture.minFilter = THREE.LinearFilter;
    floorTexture.repeat.set(1, 500);
    floorTexture.wrapS = floorTexture.wrapT = THREE.MirroredRepeatWrapping;

    flineTexture = new THREE.TextureLoader().load(path + 'meta.png');
    woodTexture = new THREE.TextureLoader().load(path + 'tronco.jpg');
    
    ballTexture = new THREE.TextureLoader().load(path + 'pelota.jpg');
    
    walls = [path + 'Yokohama2/posx.jpg', path + 'Yokohama2/negx.jpg', 
                path + 'Yokohama2/posy.jpg', path + 'Yokohama2/negy.jpg', 
                path + 'Yokohama2/posz.jpg', path + 'Yokohama2/negz.jpg']
    
    environmentMap = new THREE.CubeTextureLoader().load(walls);


    // Materiales
    for( i=0; i<world.materials.length; i++){
        if( world.materials[i].name === "sphereMaterial" ) materialEsfera = world.materials[i];
        if( world.materials[i].name === "woodMaterial" ) woodMaterial = world.materials[i];
        if( world.materials[i].name === "animalMaterial" ) animalMaterial = world.materials[i];

    }
    floorMat = new THREE.MeshLambertMaterial({color:'white', map:floorTexture});
    woodMat = new THREE.MeshLambertMaterial({color:'white', map:woodTexture});
    ballMat = new THREE.MeshLambertMaterial({color:'white', map:ballTexture});


    var floorGeometry = new THREE.PlaneGeometry(50, 4000, 1, 10);
   
    ground = new THREE.Mesh( floorGeometry, floorMat);
    ground.receiveShadow = true;

    ground.rotation.x = -Math.PI / 2;
    ground.position.y -= 0.5;
    scene.add(ground);

    var flineGeometry = new THREE.PlaneGeometry(50, 100, 1, 10);
    flineMat = new THREE.MeshLambertMaterial({color:'white', map:flineTexture});
    fline = new THREE.Mesh(flineGeometry, flineMat);  
    fline.receiveShadow = true;

    fline.rotation.x = -Math.PI / 2; 
    fline.position.z = -2030 ; 
    scene.add(fline);
    hero = new hero( 2, new CANNON.Vec3( 0, 5, 1995 ), ballMat );
    hero.body.position.z -= 20;
    hero.body.position.y = 3;
    for (var i = 0; i < 40; i++) {
        var position = -1800 + 100*i;
        var x = Math.random() * ((20) - (0) + (0));
        var sign = Math.round(Math.random());
        if(sign == 0){
            x = -x
        }
        var w = new wood(new CANNON.Vec3( x, 2, position ), woodMat );
        w.body.quaternion.setFromEuler(x,-Math.PI/2,0,'XYZ');
        world.addBody( w.body );
        scene.add( w.visual );
        woods.push( w );
    };


    loadDeers();



    //	Habitacion
	var shader = THREE.ShaderLib.cube;
	shader.uniforms.tCube.value = environmentMap;
	
	var matWalls = new THREE.ShaderMaterial({
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		dephtWrite: false,
		side: THREE.BackSide
	})

    var room = new THREE.Mesh( new THREE.CubeGeometry(4000, 4000, 6000), matWalls);
    room.receiveShadow = true;
    room.position.y += 200;
    
	scene.add(room);

    world.addBody(hero.body);
    scene.add(hero.visual);
}

function loadDeers(){
    /**
     * Ciervo 1
     */
    // Parte visual del ciervo
    var loader = new THREE.ObjectLoader();
    loader.load( 'models/ciervo.json' , 
        function(obj){
            var objtx = new THREE.MaterialLoader().load('images/deer.png');
            //var a = new animal(new CANNON.Vec3( 0, 2, position ), objtx );
            
            obj.material.map = objtx;
            obj.receiveShadow = true;
            obj.castShadow = true;
            obj.scale.set(0.2 , 0.2, 0.2)
            obj.position.z = 1750;
            var move = new TWEEN.Tween( obj.position ).to( {x: [0, 20, -20, 0],
                y: [obj.position.y, obj.position.y],
                z: [obj.position.z, obj.position.z] }, 10000 ).onUpdate(function(){
  
                    if(obj.position.x > 19.9){
                 
                        obj.rotation.z = -Math.PI;
                    }    
                    if(obj.position.x < -19.9){
                        obj.rotation.z = 0;
                    }  
                });
        //  Parte fisica del ciervo
        move.easing(TWEEN.Easing.Linear.None);
        move.interpolation( TWEEN.Interpolation.Linear );
        move.repeat(Infinity);
        move.start();
        scene.add(obj);
        var b = new animal(new CANNON.Vec3( 0, 2, 1750 ), animalMaterial );
        var move = new TWEEN.Tween( b.body.position ).to( {x: [0, 20, -20, 0],
        y: [b.body.position.y, b.body.position.y],
        z: [b.body.position.z, b.body.position.z] }, 10000 );
        move.easing(TWEEN.Easing.Linear.None);
        move.interpolation( TWEEN.Interpolation.Linear );

        move.repeat(Infinity);
        move.start();
        //scene.add(b.visual);
        world.addBody( b.body );
        animals.push( b );
    
    });

   
 /**
     * Ciervo 2
     */
    // Parte visual del ciervo
    var loader2 = new THREE.ObjectLoader();
    loader2.load( 'models/ciervomacho.json' , 
        function(obj2){
            var objtx = new THREE.MaterialLoader().load('images/deer2.png');
            //var a = new animal(new CANNON.Vec3( 0, 2, position ), objtx );
            
            obj2.material.map = objtx;
            obj2.receiveShadow = true;
            obj2.castShadow = true;
            obj2.scale.set(4, 4, 4)
            obj2.position.z = 1950;
            obj2.rotation.z = Math.PI/2;
            var move = new TWEEN.Tween( obj2.position ).to( {x: [0, 20, -20, 0],
                y: [obj2.position.y, obj2.position.y],
                z: [obj2.position.z, obj2.position.z] }, 10000 ).onUpdate(function(){
                    if(obj2.position.x > 19.9){
                        obj2.rotation.z = -Math.PI/2;
                    }    
                    if(obj2.position.x < -19.9){
                        obj2.rotation.z = Math.PI/2;
                    }  
                });
        //  Parte fisica del ciervo
        move.easing(TWEEN.Easing.Linear.None);
        move.interpolation( TWEEN.Interpolation.Linear );
        move.repeat(Infinity);
        move.start();
        scene.add(obj2);
        var a = new animal(new CANNON.Vec3( 0, 2, 1950 ), animalMaterial );
        var move = new TWEEN.Tween( a.body.position ).to( {x: [0, 20, -20, 0],
        y: [a.body.position.y, a.body.position.y],
        z: [a.body.position.z, a.body.position.z] }, 10000 );
        move.easing(TWEEN.Easing.Linear.None);
        move.interpolation( TWEEN.Interpolation.Linear );

        move.repeat(Infinity);
        move.start();
        //scene.add(a.visual);
        world.addBody( a.body );
        animals.push( a );
    
    });


        /**
     * Ciervo 3
     */
    // Parte visual del ciervo
    var loader = new THREE.ObjectLoader();
    loader.load( 'models/ciervo.json' , 
        function(obj){
            var objtx = new THREE.MaterialLoader().load('images/deer.png');
            //var a = new animal(new CANNON.Vec3( 0, 2, position ), objtx );
            
            obj.material.map = objtx;
            obj.receiveShadow = true;
            obj.castShadow = true;
            obj.scale.set(0.2 , 0.2, 0.2)
            obj.position.z = 30;
            var move = new TWEEN.Tween( obj.position ).to( {x: [0, 20, -20, 0],
                y: [obj.position.y, obj.position.y],
                z: [obj.position.z, obj.position.z] }, 10000 ).onUpdate(function(){
                    if(obj.position.x > 19.9){
                        obj.rotation.z = -Math.PI;
                    }    
                    if(obj.position.x < -19.9){
                        obj.rotation.z = 0;
                    }  
                });
        //  Parte fisica del ciervo
        move.easing(TWEEN.Easing.Linear.None);
        move.interpolation( TWEEN.Interpolation.Linear );
        move.repeat(Infinity);
        move.start();
        scene.add(obj);
        var b = new animal(new CANNON.Vec3( 0, 2, 30 ), animalMaterial );
        var move = new TWEEN.Tween( b.body.position ).to( {x: [0, 20, -20, 0],
        y: [b.body.position.y, b.body.position.y],
        z: [b.body.position.z, b.body.position.z] }, 10000 );
        move.easing(TWEEN.Easing.Linear.None);
        move.interpolation( TWEEN.Interpolation.Linear );

        move.repeat(Infinity);
        move.start();
        //scene.add(b.visual);
        world.addBody( b.body );
        animals.push( b );
    
    });

   
    /**
     * Ciervo 4
     */
    // Parte visual del ciervo
    var loader2 = new THREE.ObjectLoader();
    loader2.load( 'models/ciervomacho.json' , 
        function(obj2){
            var objtx = new THREE.MaterialLoader().load('images/deer2.png');
            //var a = new animal(new CANNON.Vec3( 0, 2, position ), objtx );
            
            obj2.material.map = objtx;
            obj2.receiveShadow = true;
            obj2.castShadow = true;
            obj2.scale.set(4, 4, 4)
            obj2.position.z = -450;
            obj2.rotation.z = Math.PI/2;
            var move = new TWEEN.Tween( obj2.position ).to( {x: [0, 20, -20, 0],
                y: [obj2.position.y, obj2.position.y],
                z: [obj2.position.z, obj2.position.z] }, 10000 ).onUpdate(function(){
                    if(obj2.position.x > 19.9){
                        obj2.rotation.z = -Math.PI/2;
                    }    
                    if(obj2.position.x < -19.9){

                        obj2.rotation.z = Math.PI/2;
                    }  
                });
        //  Parte fisica del ciervo
        move.easing(TWEEN.Easing.Linear.None);
        move.interpolation( TWEEN.Interpolation.Linear );
        move.repeat(Infinity);
        move.start();
        scene.add(obj2);
        var a = new animal(new CANNON.Vec3( 0, 2, -450 ), animalMaterial );
        var move = new TWEEN.Tween( a.body.position ).to( {x: [0, 20, -20, 0],
        y: [a.body.position.y, a.body.position.y],
        z: [a.body.position.z, a.body.position.z] }, 10000 );
        move.easing(TWEEN.Easing.Linear.None);
        move.interpolation( TWEEN.Interpolation.Linear );

        move.repeat(Infinity);
        move.start();
        //scene.add(a.visual);
        world.addBody( a.body );
        animals.push( a );
    
    });

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

function cameraUpdate(distance){
   camera.position.z += distance;
}

function onKeyDown(event){
    var distance = xSpeed * deltaTime;
    switch(event.keyCode){
        case space:
            if(onGround){
                jumping = true;
            }
            break;       
        case arrowRight:
            if(onGround){
                movingRight = true;
            }
            break;
        case arrowLeft:
            if (onGround){
                movingLeft = true;
            }
            break;        
        case arrowUp:
            if (onGround){
                accelerating = true;
            }
            break;
    }
}

function onKeyUp(event){
    switch(event.keyCode){     
        case arrowRight:
            movingRight = false;
            break;
        case arrowLeft:
            movingLeft = false;
            break;
    }
}


/**
 * Actualizacion segun pasa el tiempo
 */
function update()
{
        var seconds = clock.getDelta();    // tiempo en segundos que ha pasado
        deltaTime = seconds;
        world.step(seconds);             // recalcula el mundo tras ese tiempo
        totalTime += seconds;
        score = totalTime;
        //hero.body.position.x += 1;
        //hero.body.velocity.z = seconds * (-speed);
        if(jumping){
            hero.body.velocity.y = 10;
        }
        if(hero.body.position.y > 10){
            hero.body.velocity.y = -1;
            jumping = false
        }
        var distance = xSpeed * deltaTime;
        if (accelerating) {
            if(hero.body.velocity.z > (-maxSpeed)){
                hero.body.velocity.z -= distance;
            }
        }


        if (movingRight) {
            hero.body.position.x += distance;
        }

        if (movingLeft) {
            hero.body.position.x -= distance;
        }

        if(hero.body.position.y < 2){
            onGround = true;
        }
        else{
            onGround = false;
        }
        var distance = speed * deltaTime;
        hero.visual.position.copy(hero.body.position );
        hero.visual.quaternion.copy( hero.body.quaternion );
        if(!finish){
             document.getElementById( 'score' ).innerText = "Score: " + Math.round(score );
        }
        document.getElementById( 'highscore' ).innerText = "HighScore: " + Math.round(highscore );
    
if(hero.body.position.z < -2010){
        //finish = true;
        if (score < highscore){
            highscore = score;
        }
        if (highscore == 0){
            highscore = score;
        }
        document.getElementById( 'highscore' ).innerText = "HighScore: " + Math.round(highscore );
    
        if(!finish)
            showFinish()
        finish = true;
    }
    /*if(finish){
        showFinish();
    }*/

    // Actualiza el monitor 
    stats.update();

    // Actualiza el movimeinto del molinete
    TWEEN.update();
}

function showFinish(){
    var loader = new THREE.FontLoader();
    font = loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {
        textGeometry = new THREE.TextGeometry( "Finish!!!", {
            font: font,
            size: 10,
            height: 4,
        });
        textMaterial = new THREE.MeshPhongMaterial( 
            { color: 0xff0000, specular: 0xffffff }
        );
        text = new THREE.Mesh( textGeometry, textMaterial );
        text.position.z = -2150;
        text.position.y += 10;
        text.position.x -= 20;
        scene.add(text);
    });  

}




/**
 * Update & render
 */
function render()
{
    camera.position.z = hero.body.position.z + 20;
    camera.position.x = hero.body.position.x ;
    camera.position.y = hero.body.position.y + 5;
    requestAnimationFrame( render );
    update();
    //camera.lookAt(hero.body.position);
    renderer.render( scene, camera );
}