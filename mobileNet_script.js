let net;
const classifier = knnClassifier.create();
const show_result = document.createElement('div');
const classifier_container = document.getElementById('main-function-container');
const classifier_btn = document.getElementById('predict_btn');
const mobilenet_state = document.getElementById('mobilenet_state');
const mediaContainer = document.getElementById('media-container');
const checkbox = document.getElementById('custom-classifier-checkbox');

// Load model btn
model_loaded = false;
async function load_mobilenet() {
    mobilenet_state.textContent = 'Loading mobilenet..';  // show state
    mobilenet_state.style.color = 'red';
    net = await mobilenet.load(); 
    model_loaded = true;
    mobilenet_state.textContent = 'Successfully loaded model';  // show state
    mobilenet_state.style.color = 'green';
    classifier_btn.disabled = false; // enable btn
}

// Predict btn
async function app() {
    show_result.innerHTML = ''; // clean text
    show_result.classList.add('Info_container');
    classifier_container.appendChild(show_result);

    // Generate HTML content
    const generateHtmlContent = (result) => {
        let htmlContent = '';
        result.forEach((obj) => {
            const className = obj.className;
            const probability = (obj.probability * 100).toFixed(2);
            const firstClassName = className.split(',')[0].trim();
            htmlContent += `
            <p>Class: <span style="color: blue">${firstClassName}</span><br>
            Confidence: <span style="color: red">${probability}%</span></p>
            `;
        });
        return htmlContent;
    }

    // predict camera, image
    if (isCameraActive) {
        await current_cameraId(); // get current cameraID
        const webcamElement = document.getElementById('webcam');

        // Use MediaDevices.getUserMedia API to get the camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: currentDeviceId, width: 227, height: 227 } 
        });
        webcamElement.srcObject = stream;
        await webcamElement.play();

        if (checkbox.checked) { // if custom classifier is on, then knn as output layer
            while (isCameraActive){
                const img = tf.browser.fromPixels(webcamElement); // get the image from the webcam
    
                // Get the activation from mobilenet from the webcam.
                const activation = net.infer(img, 'conv_preds');
                // Get the most likely class and confidence from the classifier module.
                const result = await classifier.predictClass(activation);
                const classes = ['A', 'B', 'C'];
                show_result.innerHTML = `
                <p>Class: <span style="color: blue">${result.label}</span><br>
                Confidence: <span style="color: red">${(result.confidences[result.label] * 100).toFixed(2)}%</span></p>
                `;

                img.dispose();
                await tf.nextFrame();
            }
            webcam.stop();
        }else{
            while (isCameraActive) {
                const img = tf.browser.fromPixels(webcamElement); // get the image from the webcam
                const result = await net.classify(img); // Classify the image
                show_result.innerHTML = generateHtmlContent(result);
                img.dispose(); // Dispose the tensor to release the memory.
                await tf.nextFrame(); // Wait for the next frame
            }
            webcam.stop(); // Stop the webcam when not in use
        }
    }
    else {
        if (checkbox.checked) {
            const imgEl = document.getElementById('img');
            const activation = net.infer(imgEl, 'conv_preds');
            const result = await classifier.predictClass(activation);
            show_result.innerHTML = `
                <p>Class: <span style="color: blue">${result.label}</span><br>
                Confidence: <span style="color: red">${(result.confidences[result.label] * 100).toFixed(2)}%</span></p>
            `;
        }
        else {
            const imgEl = document.getElementById('img');
            const result = await net.classify(imgEl);
            show_result.innerHTML = generateHtmlContent(result);
        }
    }
}

// media toggle
var isCameraActive = false;
async function toggleCameraMode() {
    if (isCameraActive) {
        mediaContainer.innerHTML = `
            <img id="img" src="./JlUvsxa.jpg" width="227" height="227">
            <div>
                <button class="media_btn" id="upload_btn_1">
                    upload file
                    <input type="file" class="file_input" accept="image/jpeg, image/png">
                </button>
                <button class="media_btn" id="upload_btn_2">
                    camera
                    <input type="file" class="file_input" capture="camera">
                </button>
            </div>
        `;
        isCameraActive = false;

        // Reattach the event listener to the file input element
        attachFileInputEventListeners();
    } else {
        mediaContainer.innerHTML = `
            <video autoplay playsinline muted id="webcam"></video>
            <select id="camera-select"></select>
        `;
        await updateCameraSelect();
        isCameraActive = true;
    }
}
// update dropdown list  
var videoDevices = [];
async function updateCameraSelect() {
    const devices = await navigator.mediaDevices.enumerateDevices(); // get all input devices
    videoDevices = devices.filter(device => device.kind === 'videoinput'); // choose video devices
    const cameraSelect = document.getElementById('camera-select');
    cameraSelect.innerHTML = videoDevices.map((device, index) => `<option value="${index}">${device.label || `Camera ${index + 1}`}</option>`).join(''); // add to select
}

// get current cameraID
async function current_cameraId() {
    const cameraSelect = document.getElementById('camera-select');
    currentDeviceId = videoDevices[cameraSelect.value].deviceId;
}

// Add an event listener to the file input element
function attachFileInputEventListeners() {
    const fileInputs = document.querySelectorAll('.file_input');
    const imgElement = document.getElementById('img');
    fileInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            imgElement.src = url; 
        });
    });
}
attachFileInputEventListeners();

// if custom classifier is on
const addExample = async (classId, img) => {
    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.
    const activation = net.infer(img, true);

    // Pass the intermediate activation to the classifier.
    classifier.addExample(activation, classId);
};


// When files are selected, read each file and load it into an img element
function handleFileUpload(event, classId, countElementId) {
    if (model_loaded){
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                addExample(classId, img);
                const countElement = document.getElementById(countElementId);
                const currentCount = parseInt(countElement.textContent.split(': ')[1]);
                countElement.textContent = `Image count: ${currentCount + 1}`;
            };
        }
    }else{
        mobilenet_state.textContent = 'Please Load model first!';
        mobilenet_state.style.color = 'red';
    }
}
// Btn event listener (can use 0, 1, 2 label and when predict, mapping to class name)
document.getElementById('upload_classA_btn').addEventListener('change', (event) => handleFileUpload(event, document.getElementById('classA-name-input').value, 'countA'));
document.getElementById('upload_classB_btn').addEventListener('change', (event) => handleFileUpload(event, document.getElementById('classB-name-input').value, 'countB'));
document.getElementById('upload_classC_btn').addEventListener('change', (event) => handleFileUpload(event, document.getElementById('classC-name-input').value, 'countC'));