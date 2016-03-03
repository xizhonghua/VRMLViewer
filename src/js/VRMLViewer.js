var container, stats;
var camera, controls, scene, renderer;
var lightCamerahelper;
var cross;
var wrlObject = null;
var mouseDown = false;

var config = {
  vertexNormal: true,
  orignialColor: true
};

var measure = {
  boundingSphere: new THREE.Sphere(),
  vertices: 0,
  faces: 0
}

var gui;
var $helpDialog = $("#help-dialog").dialog();


$(function() {
  loadModelList(function() {
    init();
    animate();
  });
});

// load model list
function loadModelList(callback) {
  $.getJSON("models/models.json", function(modeList) {
    var list = $("#model-list");
    $.each(modeList, function(index, item) {
      list.append(new Option(item.name, item.url));
    });
    callback();
  });
}

function initGUI() {
  gui = new dat.GUI();
  gui.add(config, 'vertexNormal').onChange(updateNormal);
}

function initControls() {
  // control
  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 5.0;
  controls.zoomSpeed = 1.5;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  // controls.keys = [65, 83, 68];
  // controls.addEventListener( 'change', render );
}

function init() {
  scene = new THREE.Scene();

  var floor = createFloor();
  scene.add(floor);

  var ambient = new THREE.AmbientLight(0x666666);
  scene.add(ambient);

  var light = createLight();
  scene.add(light);
  scene.add(light.target);


  lightCamerahelper = new THREE.CameraHelper(light.shadow.camera);
  lightCamerahelper.visible = true;
  scene.add(lightCamerahelper);

  // create camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1e10);
  camera.position.z = 3;

  scene.add(camera);
  // renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.enabled = true;
  // renderer.shadowMapSoft = true;

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);


  container = document.createElement('div');
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild(stats.domElement);
  // controls
  initControls();
  $("#model-list").change(onModelListChange);
  loadModelFromUrl($("#model-list").val());
  $helpDialog.dialog('close');
  // window events
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('drop', onDrop, false);
  /* events fired on the drop targets */
  document.addEventListener('dragover', function(e) {
    // prevent default to allow drop
    e.preventDefault();
    e.stopPropagation();
  }, false);
  document.addEventListener('keypress', onKeyPress);
}

function onModelListChange(e) {
  var url = $(e.target).val();
  loadModelFromUrl(url);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // controls.handleResize();
}

function onDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files; // FileList object.
  // files is a FileList of File objects. List some properties.
  // var output = [];
  for (var i = 0, f; f = files[i]; i++) {
    if (files[i].name.endsWith('.wrl')) {
      loadModelFromFile(files[i])
      break;
    }
  }
}

function loadModelFromUrl(url, name) {
  var loader = new THREE.VRMLLoader();
  loader.load(url, onModelLoaded);
}

function loadModelFromFile(file) {
  // document.getElementById('info').innerHtml = file.name;
  var loader = new THREE.VRMLLoader();
  loader.loadFile(file, onModelLoaded);
}

function createLight() {
  // light
  var light = new THREE.SpotLight(0x999999);
  light.position.set(6, 6, 12); //.normalize();
  light.castShadow = true;


  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  light.shadow.camera.position.copy(light.position);
  light.shadow.camera.near = 10;
  light.shadow.camera.far = 20;
  light.shadow.camera.fov = 60;
  light.shadow.camera.updateProjectionMatrix();
  // light.shadow.

  return light;
}

function createFloor(object) {
  var geometry = new THREE.BoxGeometry(10, 10, 0.1);
  // geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  var texture = THREE.ImageUtils.loadTexture('textures/floor.jpg');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);

  var material = new THREE.MeshLambertMaterial({ color: 0xffffff, map: texture });
  var mesh = new THREE.Mesh(geometry, material);

  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

function onModelLoaded(object) {
  if (wrlObject) scene.remove(wrlObject);
  wrlObject = object;

  wrlObject.traverse(function(obj) {
    console.log('set cast shadow' + obj.name);
    obj.castShadow = true;
    obj.receiveShadow = true;
  });

  measureModel();
  updateNormal();
  resetCemara();
  initControls();
  scene.add(wrlObject);
}

function onKeyPress(e) {
  if (wrlObject == null) return;

  var key = event.keyCode || event.which;
  var keychar = String.fromCharCode(key);
  if (keychar == 'r') {
    wrlObject.rotation.x = wrlObject.rotation.y = wrlObject.rotation.z = 0.0;
  } else if (keychar == 'x') {
    wrlObject.rotation.x = wrlObject.rotation.x + 0.05;
  } else if (keychar == 'X') {
    wrlObject.rotation.x = wrlObject.rotation.x - 0.05;
  } else if (keychar == 'y') {
    wrlObject.rotation.y = wrlObject.rotation.y + 0.05;
  } else if (keychar == 'Y') {
    wrlObject.rotation.y = wrlObject.rotation.y - 0.05;
  } else if (keychar == 'z') {
    wrlObject.rotation.z = wrlObject.rotation.z + 0.05;
  } else if (keychar == 'Z') {
    wrlObject.rotation.z = wrlObject.rotation.z - 0.05;
  } else if (keychar == 'j') {
    wrlObject.position.x -= 0.02;
  } else if (keychar == 'l') {
    wrlObject.position.x += 0.02;
  } else if (keychar == 'i') {
    wrlObject.position.z += 0.02;
  } else if (keychar == 'k') {
    wrlObject.position.z -= 0.02;
  } else if (keychar == 'c') {
    toggleColors();
  } else if (keychar == 's') {
    lightCamerahelper.visible = !lightCamerahelper.visible;
  } else if (keychar == 'h') {
    $helpDialog.dialog('open');
  }
}

function toggleColors() {
  var index = 0;
  var colors = [0xE53853, 0xDE2837, 0x46AAAD, 0xFFD485, 0x7248F3, 0x97F27E, 0xBBBB59,
    0x00E9DC, 0x01E98A, 0xF1DF82, 0xFF8C52, 0xF66041, 0x3F9BBF,
    0xBF1725, 0xF250C7
  ];
  for (var i = 0; i < wrlObject.children.length; ++i) {
    var child = wrlObject.children[i];
    if (child.children.length == 0) continue; // sky...
    var mesh = child.children[0];
    index = (index + 1) % colors.length;
    if (mesh.userData.orgColor != null) {
      mesh.material.color = mesh.userData.orgColor;
      mesh.userData.orgColor = null;
    } else {
      mesh.userData.orgColor = mesh.material.color;
      mesh.material.color = new THREE.Color(colors[index]);
    }
  }
}

function updateNormal() {
  for (var i = 0; i < wrlObject.children.length; ++i) {
    var child = wrlObject.children[i];
    if (child.children.length == 0) continue; // sky...
    var mesh = child.children[0];
    if (config.vertexNormal) {
      mesh.geometry.computeVertexNormals();
    } else {
      //   // clear vertex normal
      //   for ( var f = 0, fl = mesh.geometry.faces.length; f < fl; f ++ ) {
      //     var face = mesh.geometry.faces[f];
      //     face.vertexNormals = [];
      //   }
      //   mesh.geometry.verticesNeedUpdate = true;
      //   mesh.geometry.normalsNeedUpdate = true;
      //   mesh.geometry.elementsNeedUpdate = true;
      //   mesh.geometry.dynamic = true;
    }
  }
}

function measureModel() {
  var vertices = []

  measure.sphere = new THREE.Sphere();
  measure.faces = 0;


  for (var i = 0; i < wrlObject.children.length; ++i) {
    var child = wrlObject.children[i];
    if (child.children.length == 0) continue; // sky...
    var mesh = child.children[0];
    vertices.push.apply(vertices, mesh.geometry.vertices);
    measure.faces += mesh.geometry.faces.length;
  }

  measure.sphere.setFromPoints(vertices);
  measure.vertices = vertices.length;

  var c = measure.sphere.center;

  $("#measure").html("#V = " + measure.vertices + " #F = " + measure.faces + " COM = " + c.toFixed(3) + " R = " + measure.sphere.radius.toFixed(3));

}

function resetCemara() {
  // move model to the center
  var c = measure.sphere.center;
  var s = 1.0 / measure.sphere.radius;
  wrlObject.position.sub(c.clone().multiplyScalar(s));
  wrlObject.position.z = 0.0; // put on the floor...
  wrlObject.scale.set(s, s, s);

  camera.position.x = camera.position.y = camera.position.z = 0;
  camera.position.z = 2.5;
  camera.rotation.x = camera.rotation.y = camera.rotation.z = 0;
}


function animate() {
  requestAnimationFrame(animate);
  if (!camera) return;
  controls.update();
  renderer.render(scene, camera);
  stats.update();
}
