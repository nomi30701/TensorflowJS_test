let net;
const show_result = document.createElement('div');
const classifier = document.getElementById('classifier');
const classifier_btn = document.getElementById('classifier_btn');
const mobilenet_state = document.getElementById('mobilenet_state');


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
            <p>Class: <span style="color: blue">${firstClassName}</span>\n
            Prob: <span style="color: red">${probability}%</span></p>
            `;
        });
        return htmlContent;
    }

    if (isCameraActive) {
        await current_cameraId();
        const webcamElement = document.getElementById('webcam');
        const webcam = await tf.data.webcam(webcamElement, { video: { deviceId: currentDeviceId } });
        
        while (isCameraActive) {
            const img = await webcam.capture();
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
    if (isCameraActive) {
        // If the camera is active, switch back to file input and image
        document.getElementById('media-container').innerHTML = `
            <img id="img" src="./JlUvsxa.jpg" width="227" height="227">
            <input type="file" id="file" accept="image/jpeg, image/png">
        `;
        isCameraActive = false;
    } else {
        document.getElementById('media-container').innerHTML = `
            <video playsinline muted id="webcam" width="224" height="224"></video>
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

// // Switch camera when the select value changes
// document.getElementById('camera-select').addEventListener('change', async () => {
//     if (isCameraActive) {
//         await switchCamera();
//         // Stop the current webcam stream
//         webcam.stop();
//         mobilenet_state.textContent = currentDeviceId;
//         // Start a new webcam stream with the new camera
//         webcam = await tf.data.webcam(webcamElement, { video: { deviceId: currentDeviceId } });
//     }
// });