let net;
const show_result = document.createElement('div');
const classifier = document.getElementById('classifier');
const classifier_btn = document.getElementById('classifier_btn');
const mobilenet_state = document.getElementById('mobilenet_state');
const imgElement = document.getElementById('img');

// Load model btn
async function load_mobilenet() {    
    mobilenet_state.textContent = 'Loading mobilenet..';  // show state
    mobilenet_state.style.color = 'red';
    net = await mobilenet.load(); 
    mobilenet_state.textContent = 'Successfully loaded model';  // show state
    mobilenet_state.style.color = 'green';
    classifier_btn.disabled = false; // enable btn
}



// Predict btn
async function app() {
    show_result.innerHTML = ''; // clean text
    show_result.classList.add('Info_container');
    classifier.appendChild(show_result);

    // Generate HTML content
    const generateHtmlContent = (result) => {
        let htmlContent = '';
        result.forEach((obj) => {
            const className = obj.className;
            const probability = (obj.probability * 100).toFixed(2);
            const firstClassName = className.split(',')[0].trim();
            htmlContent += `
            <p>Class: <span style="color: blue">${firstClassName}</span><br>
            Prob: <span style="color: red">${probability}%</span></p>
            `;
        });
        return htmlContent;
    }

    // TODO: add capture photo
    if (isCameraActive) {
        await current_cameraId(); // get current cameraID
        const webcamElement = document.getElementById('webcam');

        // Use MediaDevices.getUserMedia API to access the webcam
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: currentDeviceId, width: 227, height: 227 } 
        });
        webcamElement.srcObject = stream;
        await webcamElement.play();

        while (isCameraActive) {
            const img = tf.browser.fromPixels(webcamElement);
            const result = await net.classify(img);
            show_result.innerHTML = generateHtmlContent(result);
            img.dispose(); // Dispose the tensor to release the memory.
            await tf.nextFrame(); // Wait for the next frame
        }
        webcam.stop(); // Stop the webcam when not in use
    }
    else {
        const imgEl = document.getElementById('img');
        const result = await net.classify(imgEl);
        show_result.innerHTML = generateHtmlContent(result);
    }
}

// media toggle
var isCameraActive = false;
async function toggleCameraMode() {
    const mediaContainer = document.getElementById('media-container');
    if (isCameraActive) {
        // If the camera is active, switch back to file input and image
        mediaContainer.innerHTML = `
            <img id="img" src="./JlUvsxa.jpg" width="227" height="227">
            <div>
                <button class="media_btn" id="upload_btn">
                    upload file
                    <input type="file" id="file" accept="image/jpeg, image/png">
                </button>
                <button id="upload_btn">
                    camera
                    <input type="file" id="file" capture="camera">
                </button>
            </div>
        `;
        isCameraActive = false;

        // Reattach the event listener to the file input element
        document.getElementById('file').addEventListener('change', (event) => {
            const file = event.target.files[0];
            const url = URL.createObjectURL(file);
            document.getElementById('img').src = url;
        });
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
document.getElementById('file').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    imgElement.src = url;
});