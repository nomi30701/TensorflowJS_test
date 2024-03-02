console.log("yolov8.js loaded");

const MODEL_URL = 'github page\TensorflowJS_test\src\yolov8n_model\model.json';

const model = await loadGraphModel(MODEL_URL);
const cat = document.getElementById('cat');
model.execute(tf.fromPixels(cat));