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
                // mobilenet 作為特徵提取器
                const activation = net.infer(img, 'conv_preds');
                // Get the most likely class and confidence from the classifier module.
                const result = await classifier.predictClass(activation);
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
            // mobilenet 作為特徵提取器
            const activation = net.infer(imgEl, 'conv_preds');
            const result = await classifier.predictClass(activation);
            show_result.innerHTML = `
                <p>Class: <span style="color: blue">${classNames[result.label]}</span><br>
                Confidence: <span style="color: red">${(result.confidences[result.label] * 100).toFixed(2)}%</span></p>
            `;
        }else {
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


// when load btn is clicked, load the images to knn
let classNames;
async function handleFileUpload() {
    if (!model_loaded){
        mobilenet_state.textContent = 'Please Load model first!';
        mobilenet_state.style.color = 'red';
        return;
    }
    
    classNames = [
        document.getElementById('classA-name-input').value, 
        document.getElementById('classB-name-input').value, 
        document.getElementById('classC-name-input').value
    ];

    mobilenet_state.textContent = 'Loading images to KNN..';
    mobilenet_state.style.color = 'red';

    for (let i = 0; i < imagesArray.length; i++) {
        if (imagesArray[i].length === 0) continue;
        
        for (let j = 0; j < imagesArray[i].length; j++) {
            const img = document.createElement('img'); 
            img.src = URL.createObjectURL(imagesArray[i][j]);
            img.onload = () =>{
                addExample(i, img);
            }
        }
    }

    mobilenet_state.textContent = 'Loading images to KNN Done!';
    mobilenet_state.style.color = 'green';
}

const addExample = async (classId, img) => {
    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.
    const activation = net.infer(img, true);

    // Pass the intermediate activation to the classifier.
    classifier.addExample(activation, classId);
};


// save images to array
let imagesArray = [[], [], []];
const ids = ['upload_classA_btn', 'upload_classB_btn', 'upload_classC_btn'];
const counts_label_id = ['countA', 'countB', 'countC'];

ids.forEach((id, index) => {
    document.getElementById(id).addEventListener('change', (event) => {
        imagesArray[index].push(...event.target.files);
        document.getElementById(counts_label_id[index]).textContent = `Image count: ${imagesArray[index].length}` ;
        console.log(imagesArray);
    });
});

// reset images btn
function resetImages() {
    imagesArray = [[], [], []];
    classifier = knnClassifier.create(); // reset classifier
    counts_label_id.forEach((id) => {
        document.getElementById(id).textContent = `Image count: 0`;
    });
}

