var scene, camera, minimap, renderer;
var plane;

var robot;

var base;                                                                       // Para la base
var arm, axis, ball, rectangle;                                                 // Para el brazo    
var forearm, foreBase, foreRect1, foreRect2, foreRect3, foreRect4, foreHand;    // Para el antebrazo
var gripper1, gripper2,cube1, cube2, cube3, cube4;                                                                // Para las pinzas

var r = t = 400;
var l = b = -r;

var arrowUp = 38;
var arrowLeft = 37;
var arrowRight = 39;
var arrowDown = 40;

var clock;

var speed = 30;
var rotateSpeed = 1;
var maxRotation = Math.PI;
var deltaTime = 0;
var totalTime = 0;
var before = Date.now();
var angle = 0;
var initialYGripper1 = 0;
var initialYGripper2 = 0;

var steelTexture;
var woodTexture;
var environmentMap;
var floorMat;
var steelMat;
var woodMat;

init();
loadScene();
setupGui();
render();

function init(){

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor( new THREE.Color(0x9b9b9b) );
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    var ar = window.innerWidth / window.innerHeight;
    renderer.autoClear = false;
    setCameras(ar);

    clock = new THREE.Clock();

    // Eventos
    window.addEventListener('resize',updateAspectRatio);
    document.addEventListener('keydown', onKeyDown);

    // Luces
    var pointLight = new THREE.PointLight(0xFFFFFF, 0.5);   
    pointLight.position.set( 10, 10, -10);
    scene.add(pointLight);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight.position.set(-10, 5, 10);
    scene.add(directionalLight);

    var spotLight = new THREE.SpotLight(0xFFFFFF, 0.5);
    spotLight.position.set(700, 700, 100);
    spotLight.target.position.set(0, 0, 0);
    spotLight.angle = Math.PI/7;
    spotLight.penumbra = 0.6;
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;
    scene.add(spotLight);
}

// Arreglar
function onKeyDown(event){
    console.log(event.keyCode);
    var distance = speed * deltaTime;
    var rotateSpeed = rotateSpeed * deltaTime;
    switch(event.keyCode){
        case arrowUp:
            robot.position.x += distance;
            break;
        case arrowDown:
            robot.position.x -= distance;
            break;
        case arrowLeft:
            robot.position.z -= distance;
            break;
        case arrowRight:
            robot.position.z += distance;
            break;
        }
}


function setupGui()
{
    // Definicion de los controles
    effectController = {
        base: 1,
        hand: 1,
        forearmY: 1,
        forearmZ: 1,
        grippersRotation: 1,
        grippersSeparation: 1,
    };

    // Creacion interfaz
    var gui = new dat.GUI();

    // Construccion del menu
    var h = gui.addFolder("Control robot");
    //h.add(effectController, "mensaje").name("Peonza");
    h.add(effectController, "base", -180, 180, 1).name("Giro Base").onChange(
        function(val){
            var angle = val * deltaTime;
            base.rotation.y = angle ;
                   });
    h.add(effectController, "hand", -45, 45, 1).name("Giro Brazo").onChange(
        function(val){
            var angle = val * deltaTime;
            arm.rotation.z = angle ;
                   });
    h.add(effectController, "forearmY", -180, 180, 1).name("Giro Antebrazo Y").onChange(
        function(val){
            var angle = val * deltaTime;
            forearm.rotation.y = angle ;
                   });
    h.add(effectController, "forearmZ", -90, 90, 1).name("Giro Antebrazo Z").onChange(
        function(val){
            var angle = val * deltaTime;
            forearm.rotation.z = angle ;
                   });
    h.add(effectController, "grippersRotation", -40, 220, 1).name("Giro Pinza").onChange(
        function(val){
            var angle = val * deltaTime;
            foreHand.rotation.y = angle ;   // Por que es y , no z?
                   });
    h.add(effectController, "grippersSeparation", 0, 15, 1).name("Separacion pinza").onChange(
        function(val){
                    /* Si la separacion va de 0 a 15 entonces cada punto que se incremente o decremente tiene que aumentar o disminuir la distancia una cantidad proporcional.
                        La distancia de la pinza hasta el centro del brazo (distancia maxima que puede cerrarse) es 20. Hay que tener en cuenta lo que mide cada pinza (2).
                         */
                    var variation = (20 - 2 ) / 15;
                    //  Mueve las pinzas al centro
                    gripper1.position.y = -1
                    gripper2.position.y = 1

                    //  Realiza la separacion correspondiente
                    gripper1.position.y -= variation * val
                    gripper2.position.y += variation * val

                   });
}



function loadScene(){
    // Texturas
    var path = "images/";
    var floorTexture = new THREE.TextureLoader().load(path + 'metal_128.jpg');
    floorTexture.magFilter = THREE.LinearFilter;
    floorTexture.minFilter = THREE.LinearFilter;
    floorTexture.repeat.set(3, 2);
    floorTexture.wrapS = floorTexture.wrapT = THREE.MirroredRepeatWrapping;
    walls = [path + 'posx.jpg', path + 'negx.jpg', 
                path + 'posy.jpg', path + 'negy.jpg', 
                path + 'posz.jpg', path + 'negz.jpg']
    environmentMap = new THREE.CubeTextureLoader().load(walls);

    steelTexture = new THREE.TextureLoader().load(path + 'metal_128.jpg');
    woodTexture = new THREE.TextureLoader().load(path + 'wood512.jpg');
    // Materiales
    floorMat = new THREE.MeshLambertMaterial({color:'white', map:floorTexture});
    steelMat = new THREE.MeshPhongMaterial({color:'grey',
                                    specular:'grey',
                                    shininess: 5,
                                    map:steelTexture
     });
    woodMat = new THREE.MeshLambertMaterial({color:'white', map:woodTexture});
    

    plane = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    floor = new THREE.Mesh( plane, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
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

    var room = new THREE.Mesh( new THREE.CubeGeometry(1000, 1000, 1000), matWalls);
    room.position.y += 500;
    room.receiveShadow = true;
	scene.add(room);

    loadRobot();
    
}

function setCameras(ar){
    var origen = new THREE.Vector3(0, 0, 0);

    if(ar > 1){
        minimap = new THREE.OrthographicCamera( l*ar, r*ar, t, b, -1000 , 4000);
    }
    else{
        minimap = new THREE.OrthographicCamera( l, r, t/ar, b/ar, -1000, 4000);
    }
    minimap.position.set(0 , 20, 0);
    minimap.lookAt(origen);
    minimap.up = new THREE.Vector3(0, 0, -1);
    minimap.updateProjectionMatrix();


    camera = new THREE.PerspectiveCamera( 50, ar , 0.1, 2000 );
    camera.position.set( 0, 400, 0 );
    camera.lookAt(0, 0, 0);

    scene.add(camera);
    scene.add(minimap);

    cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
    cameraControls.target.set( 0, 0, 0 );
    cameraControls.noKeys = true;
    // ¿Necesario?
    //cameraControls = new THREE.OrbitControls( minimap, renderer.domElement );
    //cameraControls.target.set( 0, 0, 0 );
   
}


function loadArm(){
    arm = new THREE.Object3D();
    arm.castShadow = true;
    arm.receiveShadow = true;
    //  Primero dibujar el eje
    var geoCil = new THREE.CylinderGeometry(20, 20, 18, 50);
    var matCil = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    axis = new THREE.Mesh(geoCil, steelMat);
    axis.rotation.x = Math.PI / 2;
    axis.castShadow = true;
    axis.receiveShadow = true;
    arm.add(axis);
    // Depues dibujar el "esparrago"
    var geoRect = new THREE.BoxGeometry(18, 120,12);
    var matRect = new THREE.MeshBasicMaterial({color: 'red', wireframe:true});
    rect = new THREE.Mesh(geoRect, steelMat);
    rect.position.y += 60;
    rect.castShadow = true;
    rect.receiveShadow = true;
    arm.add(rect);
    // Finalmente dibujarl a rotula y añadir todo al brazo del robot
    var geoBall = new THREE.SphereGeometry(20, 50, 50);
    //var matBall = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    var shader = THREE.ShaderLib.cube;
	shader.uniforms.tCube.value = environmentMap;
    
    var matBall = new THREE.MeshPhongMaterial({color:'white', envMap:environmentMap});
    ball = new THREE.Mesh(geoBall, matBall);
    ball.position.y += 120;
    ball.castShadow = true;
    ball.receiveShadow = true;
    arm.add(ball);

    base.add(arm);
}

function loadForearm(){
    forearm = new THREE.Object3D();
    forearm.castShadow = true;
    forearm.receiveShadow = true;
    //  Primero dibujar el cilindro (base)
    var geoBase = new THREE.CylinderGeometry(22, 22, 6, 50);
    var matBase = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    foreBase = new THREE.Mesh(geoBase, woodMat);
    foreBase.castShadow = true;
    foreBase.receiveShadow = true;
    forearm.add(foreBase);
    //  Despues dibujar los 4 nervios
    var geoRect = new THREE.BoxGeometry(4, 80, 4);
    var matRect = new THREE.MeshBasicMaterial({color:'red', wireframe:true});
    foreRect1 = new THREE.Mesh(geoRect, woodMat);
    foreRect1.castShadow = true;
    foreRect1.receiveShadow = true;
    foreRect1.position.x += 11;
    foreRect1.position.y += 43;
    foreRect1.position.z += 11;
    foreRect2 = new THREE.Mesh(geoRect, woodMat);
    foreRect2.castShadow = true;
    foreRect2.receiveShadow = true;
    foreRect2.position.x += 11;
    foreRect2.position.y += 43;
    foreRect2.position.z -= 11;
    foreRect3 = new THREE.Mesh(geoRect, woodMat);
    foreRect3.castShadow = true;
    foreRect3.receiveShadow = true;
    foreRect3.position.x -= 11;
    foreRect3.position.y += 43;
    foreRect3.position.z += 11;
    foreRect4 = new THREE.Mesh(geoRect, woodMat);
    foreRect4.castShadow = true;
    foreRect4.receiveShadow = true;
    foreRect4.position.x -= 11;
    foreRect4.position.y += 43;
    foreRect4.position.z -= 11;

    forearm.add(foreRect1);
    forearm.add(foreRect2);
    forearm.add(foreRect3);
    forearm.add(foreRect4);

    //  Finalmente la esfera (mano)
    var geoHand = new THREE.CylinderGeometry(15, 15, 40, 50);
    var matHand = new THREE.MeshBasicMaterial({color:'red', wireframe:true});
    foreHand = new THREE.Mesh(geoHand, woodMat);
    foreHand.position.y += 83;
    foreHand.rotation.x = Math.PI / 2;
    foreHand.castShadow = true;
    foreHand.receiveShadow = true;
    forearm.add(foreHand);
    camera.position = foreHand.position;

    arm.add(forearm);
}

//  Funcion que carga las pinzas del robot
function loadGrippers(){
    gripper1 = new THREE.Object3D();
    gripper2 = new THREE.Object3D();
    var heigth = 20;
    var width = 19;
    var depth = 4;
    //  La primera parte de la pinza
    var semilladoY = heigth/2;
    var semilladoX = width/2;
    var semilladoZ = depth/2;

    var geometry1 = new THREE.Geometry();
    geometry1.vertices.push(
        new THREE.Vector3(-semilladoX, -semilladoY,  semilladoZ),  // 0
        new THREE.Vector3( semilladoX, -semilladoY,  semilladoZ),  // 1
        new THREE.Vector3(-semilladoX,  semilladoY,  semilladoZ),  // 2
        new THREE.Vector3( semilladoX,  semilladoY,  semilladoZ),  // 3
        new THREE.Vector3(-semilladoX, -semilladoY, -semilladoZ),  // 4
        new THREE.Vector3( semilladoX, -semilladoY, -semilladoZ),  // 5
        new THREE.Vector3(-semilladoX,  semilladoY, -semilladoZ),  // 6
        new THREE.Vector3( semilladoX,  semilladoY, -semilladoZ),  // 7
    );
    geometry1.faces.push(
        //  Front
        new THREE.Face3(0, 1, 2),
        new THREE.Face3(0, 2, 3),
        //  Right
        new THREE.Face3(1, 7, 3),
        new THREE.Face3(1, 5 ,7),
        //  Back
        new THREE.Face3(5, 6, 7),
        new THREE.Face3(5, 4, 6),
        //  Left
        new THREE.Face3(4, 2, 6),
        new THREE.Face3(4, 0, 2),
        //  Top
        new THREE.Face3(2, 7, 6),
        new THREE.Face3(2, 3, 7),
        //  Bottom
        new THREE.Face3(4, 5, 1),
        new THREE.Face3(4, 1, 0),
    );
    //  La parte de la pinza que es mas pequeña (la mitad)
    var semilladoY2 = semilladoY / 2;
    var semilladoX2 = semilladoX / 2;
    var semilladoZ2 = semilladoZ / 2;

    //  La segunda parte de la pinza
    var geometry2 = new THREE.Geometry();
    geometry2.vertices.push(
        new THREE.Vector3(-semilladoX, -semilladoY,  semilladoZ),  // 0
        new THREE.Vector3( semilladoX, -semilladoY2,  semilladoZ2),  // 1
        new THREE.Vector3(-semilladoX,  semilladoY,  semilladoZ),  // 2
        new THREE.Vector3( semilladoX,  semilladoY2,  semilladoZ2),  // 3
        new THREE.Vector3(-semilladoX, -semilladoY, -semilladoZ),  // 4
        new THREE.Vector3( semilladoX, -semilladoY2, -semilladoZ2),  // 5
        new THREE.Vector3(-semilladoX,  semilladoY, -semilladoZ),  // 6
        new THREE.Vector3( semilladoX,  semilladoY2, -semilladoZ2),  // 7
    );
    geometry2.faces.push(
        //  Front
        new THREE.Face3(2, 1, 0),
        new THREE.Face3(2, 3, 1),
        //  Right
        new THREE.Face3(1, 5, 3),
        new THREE.Face3(1, 7, 5),
        //  Back
        new THREE.Face3(6, 5, 4),
        new THREE.Face3(6, 7, 5),
        //  Left
        new THREE.Face3(0, 2, 6),
        new THREE.Face3(0, 6, 4),
        //  Top
        new THREE.Face3(3, 6, 2),
        new THREE.Face3(3, 7, 6),
        //  Bottom
        new THREE.Face3(1, 4, 0),
        new THREE.Face3(1, 4, 5),
    );

    var cubeMat = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    cube1 = new THREE.Mesh(geometry1, cubeMat);
    cube2 = new THREE.Mesh(geometry2, cubeMat);
    cube3 = new THREE.Mesh(geometry1, cubeMat);
    cube4 = new THREE.Mesh(geometry2, cubeMat);
    cube2.position.x += 19;
    cube4.position.x += 19;
    gripper1.add(cube1);
    gripper1.add(cube2);
    gripper2.add(cube3);
    gripper2.add(cube4);

    gripper1.rotation.x += Math.PI/2;
    gripper2.rotation.x += Math.PI/2;

    gripper1.position.y += 20;
    gripper2.position.y -= 20;
    
    foreHand.add(gripper1);
    foreHand.add(gripper2);
}

function loadRobotBase(){
    // La base cilindrica
    var geoCil = new THREE.CylinderGeometry(50, 50, 15, 50);
    var matCil = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    base = new THREE.Mesh(geoCil, steelMat);
    base.castShadow = true;
    base.receiveShadow = true;
    robot.add(base);
}
function loadRobot(){
    robot = new THREE.Object3D();
    robot.castShadow = true;
    robot.receiveShadow = true;
    loadRobotBase();
    loadArm();
    loadForearm();
    forearm.position.y += 120;
    loadGrippers();
    initialYGripper1 = gripper1.position.y
    gripper1.position.x += 5;
    gripper1.position.y -= 3;
    initialYGripper2 = gripper2.position.y
    gripper2.position.y += 4;
    gripper2.position.x += 5;
    scene.add(robot);
    minimap.lookAt(base.position);
}


function render(){
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}

function updateAspectRatio()
{
    // Indicarle al motor las nuevas dimensiones del canvas
    renderer.setSize(window.innerWidth,window.innerHeight);

    var ar = window.innerWidth/window.innerHeight;

    if(ar>1){
        minimap.left = l * ar;
        minimap.right = r * ar;
        minimap.top = t;
        minimap.bottom = b;
     }
    else{
        minimap.left = l;
        minimap.right = r;
        minimap.top = t/ar;
        minimap.bottom = b/ar;    
    }

    camera.aspect = ar;

    // Se ha variado el volumen de la vista
    
    camera.updateProjectionMatrix();
    minimap.updateProjectionMatrix();
}

function update()
{
    // Cambios para actualizar la camara segun mvto del raton
    cameraControls.update();
}

function render()
{
    requestAnimationFrame( render );
    deltaTime = clock.getDelta();
    totalTime += deltaTime;
    update();
    // Mini mapa
    renderer.clear();
    renderer.setViewport(0,0, 
        window.innerWidth/4,window.innerHeight/4);
    renderer.render( scene, minimap );
    // Camara normal (¿Toda la ventana o restar minimapa?)
    renderer.setViewport(0, 0, 
        window.innerWidth,window.innerHeight);
    renderer.render( scene, camera );
}