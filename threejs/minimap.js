var scene, camera, minimap, renderer;
var plane;

var robot;

var base;                                                                       // Para la base
var arm, axis, ball, rectangle;                                                 // Para el brazo    
var forearm, foreBase, foreRect1, foreRect2, foreRect3, foreRect4, foreHand;    // Para el antebrazo
var gripper1, gripper2,cube1, cube2, cube3, cube4;                                                                // Para las pinzas

var r = t = 400;
var l = b = -r;

init();
loadScene();
render();

function init(){
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor( new THREE.Color(0x9b9b9b) );
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    var ar = window.innerWidth / window.innerHeight;
    renderer.autoClear = false;
    setCameras(ar);

    // Eventos
    window.addEventListener('resize',updateAspectRatio);
}
function loadScene(){
    // Cargar el plano que funciona como base de la escena
    loadBase();
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
    camera.position.set( 0, 400, 200 );
    camera.lookAt(0, 0, 0);

    scene.add(camera);
    scene.add(minimap);

    cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
    cameraControls.target.set( 0, 0, 0 );

    // ¿Necesario?
    //cameraControls = new THREE.OrbitControls( minimap, renderer.domElement );
    //cameraControls.target.set( 0, 0, 0 );
   
}

function loadBase(){
    var geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    var material = new THREE.MeshBasicMaterial( { color:0xFFFFFF, side: THREE.DoubleSide, wireframe:true})

    plane = new THREE.Mesh( geometry, material);
    plane.rotation.x = Math.PI / 2
    scene.add(plane);
  
}

function loadArm(){
    arm = new THREE.Object3D();
    //  Primero dibujar el eje
    var geoCil = new THREE.CylinderGeometry(20, 20, 18, 50);
    var matCil = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    axis = new THREE.Mesh(geoCil, matCil);
    axis.rotation.x = Math.PI / 2;
    arm.add(axis);
    // Depues dibujar el "esparrago"
    var geoRect = new THREE.BoxGeometry(18, 120,12);
    var matRect = new THREE.MeshBasicMaterial({color: 'red', wireframe:true});
    rect = new THREE.Mesh(geoRect, matRect);
    rect.position.y += 60;
    arm.add(rect);
    // Finalmente dibujarl a rotula y añadir todo al brazo del robot
    var geoBall = new THREE.SphereGeometry(20, 50, 50);
    var matBall = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    ball = new THREE.Mesh(geoBall, matBall);
    ball.position.y += 120;
    arm.add(ball);

    robot.add(arm);
}

function loadForearm(){
    forearm = new THREE.Object3D();
    //  Primero dibujar el cilindro (base)
    var geoBase = new THREE.CylinderGeometry(20, 20, 6, 50);
    var matBase = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    foreBase = new THREE.Mesh(geoBase, matBase);
    forearm.add(foreBase);
    //  Despues dibujar los 4 nervios
    var geoRect = new THREE.BoxGeometry(4, 80, 4);
    var matRect = new THREE.MeshBasicMaterial({color:'red', wireframe:true});
    foreRect1 = new THREE.Mesh(geoRect, matRect);
    foreRect1.position.x += 11;
    foreRect1.position.y += 43;
    foreRect1.position.z += 11;
    foreRect2 = new THREE.Mesh(geoRect, matRect);
    foreRect2.position.x += 11;
    foreRect2.position.y += 43;
    foreRect2.position.z -= 11;
    foreRect3 = new THREE.Mesh(geoRect, matRect);
    foreRect3.position.x -= 11;
    foreRect3.position.y += 43;
    foreRect3.position.z += 11;
    foreRect4 = new THREE.Mesh(geoRect, matRect);
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
    foreHand = new THREE.Mesh(geoHand, matHand);
    foreHand.position.y += 83;
    foreHand.rotation.x = Math.PI / 2;
    forearm.add(foreHand);
    camera.position = foreHand.position;
    robot.add(forearm);
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
        new THREE.Face3(0, 3, 2),
        new THREE.Face3(0, 1, 3),
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

    var cubeMat = new THREE.MeshBasicMaterial({color:'red', wireframe:true});
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
    gripper1.position.x += 5;
    gripper2.position.x += 5;
    robot.add(gripper1);
    robot.add(gripper2);
}

function loadRobotBase(){
    // La base cilindrica
    var geoCil = new THREE.CylinderGeometry(50, 50, 15, 50);
    var matCil = new THREE.MeshBasicMaterial( {color: 'red', wireframe:true} );
    base = new THREE.Mesh(geoCil, matCil);
    robot.add(base);
}
function loadRobot(){
    robot = new THREE.Object3D();
    loadRobotBase();
    loadArm();
    loadForearm();
    forearm.position.y += 120;
    loadGrippers();
    gripper1.position.y += 200;  
    gripper2.position.y += 200;
    gripper1.position.z -= 20;  
    gripper2.position.z += 20;
    scene.add(robot);
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