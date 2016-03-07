var container, stats;
var camera, controls, scene, renderer;
var lightCamerahelpers = [];
var cross;
var wrlObject = null;
var mouseDown = false;
var walls = [];

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
    render();
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
  controls.addEventListener('change', render);
}

function init() {
  scene = new THREE.Scene();

  walls = createWalls();
  $.each(walls, function(index, wall) {
    scene.add(wall);
  })

  var ambient = new THREE.AmbientLight(0xaaaaaa);
  scene.add(ambient);

  for (var i = 0; i < 1; ++i) {
    var light = createLight(2 * i - 1);
    scene.add(light);
    scene.add(light.target);

    // add light camera helper
    var lightCamerahelper = new THREE.CameraHelper(light.shadow.camera);
    lightCamerahelper.visible = false;
    scene.add(lightCamerahelper);
    lightCamerahelpers.push(lightCamerahelper)
  }

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
  container.id = "canvas";
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);
  // stats = new Stats();
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.top = '0px';
  // container.appendChild(stats.domElement);

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
  render();
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

function createLight(y_dir) {
  // light
  var light = new THREE.SpotLight(0x333333, 1.0, 1e5, Math.PI / 3, 2.0, 1);
  light.position.set(3, 3 * y_dir, 12); //.normalize();
  light.castShadow = true;


  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.bias = 0.001;

  // update light camera

  light.shadow.camera.position.copy(light.position);
  light.shadow.camera.near = 10;
  light.shadow.camera.far = 20;
  light.shadow.camera.fov = 60;
  light.shadow.camera.updateProjectionMatrix();
  // light.shadow.

  return light;
}

function createWalls(object) {
  var SIZE = 10;
  var DEPTH = 0.1;

  var geometry = new THREE.BoxGeometry(SIZE, SIZE, DEPTH);

  var texture = THREE.ImageUtils.loadTexture('textures/floor.jpg');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);

  var material = new THREE.MeshLambertMaterial({ color: 0xffffff, map: texture });
  var floor = new THREE.Mesh(geometry, material);

  floor.castShadow = false;
  floor.receiveShadow = true;

  var left = floor.clone();
  left.position.x = 0;
  left.position.y = -5;
  left.position.z = 5;
  left.rotateX(Math.PI / 2);

  var right = left.clone();
  right.position.y = 5;

  var back = floor.clone();
  back.position.x = -5;
  back.position.y = 0;
  back.position.z = 5;
  back.rotateY(Math.PI / 2);


  return [floor, left, right, back];
}

function clearModel() {

  var objectsToRemove = [wrlObject];

  // find all wireframes
  scene.traverse(function(obj) {
    if (obj instanceof THREE.EdgesHelper)
      objectsToRemove.push(obj);
  });

  $.each(objectsToRemove, function(index, obj) {
    if (obj) scene.remove(obj);
  });

}

function onModelLoaded(object) {
  clearModel();

  wrlObject = object;

  wrlObject.traverse(function(obj) {
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (obj.geometry instanceof THREE.SphereGeometry) {
      // sky
      return;
    }
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dynamic = true;
      var wireframe = new THREE.EdgesHelper(obj, 0x333333, 0.01);
      scene.add(wireframe);
    }
  });

  measureModel();
  updateNormal();
  resetCemara();
  initControls();
  scene.add(wrlObject);

  render();
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
  } else if (keychar == 'u') {
    wrlObject.position.y -= 0.02;
  } else if (keychar == 'o') {
    wrlObject.position.y += 0.02;
  } else if (keychar == 'c') {
    toggleColors();
  } else if (keychar == 'w') {
    toggleWireframe();
  } else if (keychar == 'f') {
    toggleWalls();
  } else if (keychar == 's') {
    for (var i = 0; i < lightCamerahelpers.length; ++i)
      lightCamerahelpers[i].visible = !lightCamerahelpers[i].visible;
  } else if (keychar == 'n') {
    config.vertexNormal = !config.vertexNormal;
    updateNormal();
  } else if (keychar == 'h') {
    $helpDialog.dialog('open');
  }

  // render twice...
  render();

  render();
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

function toggleWireframe() {
  if (!wrlObject) return;

  scene.traverse(function(obj) {
    if (obj instanceof THREE.EdgesHelper)
      obj.visible = !obj.visible;
  });
}

function toggleWalls() {
  $.each(walls, function(index, wall) {
    wall.visible = !wall.visible;
  });
}

function updateNormal() {
  wrlObject.traverse(function(obj) {
    if (!obj.geometry) return;
    if (config.vertexNormal) {
      obj.geometry.computeVertexNormals();
    } else {
      // clear vertex normal
      for (var f = 0, fl = obj.geometry.faces.length; f < fl; f++) {
        var face = obj.geometry.faces[f];
        face.vertexNormals = [];
      }
    }
    // clear the buffer...
    delete obj.geometry._bufferGeometry;
    delete obj.geometry.__directGeometry;
    obj.geometry.normalsNeedUpdate = true;
  });
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

  camera.position.x = camera.position.y = 0;
  camera.position.z = 2.5;
  camera.rotation.x = camera.rotation.y = camera.rotation.z = 0;
}


function animate() {
  requestAnimationFrame(animate);
  if (!camera) return;
  controls.update();
}

function render() {
  renderer.render(scene, camera);
}
