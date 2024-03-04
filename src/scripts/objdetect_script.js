let coco;
const imgel = document.getElementById('imgel-objdetect');
const cocoSsd_state = document.getElementById('coco-state');
const upload_btn_coco = document.getElementById('input-openImg-coco');
const camera_btn_coco = document.getElementById('input-camera-coco');
const obj_canvas = document.getElementById('objdetect-canvas');
const toggle_btn_coco = document.getElementById('objdetect-toggle-btn');
const coco_camera  = document.getElementById('objdetect-camera');

async function load_coco() {
    cocoSsd_state.textContent = 'Loading Coco-SSD..';  // show state
    cocoSsd_state.style.color = 'red';
    coco = await cocoSsd.load();
    model_loaded = true;
    cocoSsd_state.textContent = 'Successfully loaded model';  // show state
    cocoSsd_state.style.color = 'green';
    toggle_btn_coco.disabled = false;
    upload_btn_coco.disabled = false; 
    camera_btn_coco.disabled = false; 
}

// camera mode
let shouldPredictAndDraw = false;
async function toggleCameraMode_objdetect() {
    const video = document.getElementById('objdetect-camera');

    // If there's already a stream, stop it
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        shouldPredictAndDraw = false;  // Stop the prediction loop

        // Clear the canvas
        const ctx = obj_canvas.getContext('2d');
        ctx.clearRect(0, 0, obj_canvas.width, obj_canvas.height);
    }else {
        // Otherwise, start a new stream
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });

        video.srcObject = stream;

        // Wait for the video to start playing
        await new Promise((resolve) => video.onplaying = resolve);

        // Run prediction and draw bounding box on each frame
        const predictAndDraw = async () => {
            if (!shouldPredictAndDraw) return;  // Stop if the flag is false

            const predictions = await coco.detect(video);
            drawBoundingBox(predictions, video, video.videoWidth, video.videoHeight);

            // Call this function again on the next animation frame
            requestAnimationFrame(predictAndDraw);
        };

        shouldPredictAndDraw = true;  // Start the prediction loop
        predictAndDraw();
    }
}

// if upload img -> predict and draw bounding box
async function handleFileChange(event) {
    const file = event.target.files[0];
    imgel.src = URL.createObjectURL(file);
    await imgel.decode();
    const predictions = await coco.detect(imgel);
    drawBoundingBox(predictions, imgel, imgel.width, imgel.height);
}
upload_btn_coco.addEventListener('change', handleFileChange);
camera_btn_coco.addEventListener('change', handleFileChange);


// draw bounding box
function drawBoundingBox(predictions, src, width, height) {
    obj_canvas.width = width;
    obj_canvas.height = height;

    const ctx = obj_canvas.getContext('2d');

    // Calculate scale factor based on image size
    const scaleFactor = Math.sqrt(src.width * src.height) / 500;

    ctx.drawImage(src, 0, 0);
    predictions.forEach(prediction => {
        // Generate a random color for each bounding box
        const color = `rgb(255, 0, 255)`;

        ctx.beginPath();
        ctx.rect(
            prediction.bbox[0],
            prediction.bbox[1],
            prediction.bbox[2],
            prediction.bbox[3]
        );
        
        // Calculate text position
        let textX = prediction.bbox[0];
        let textY = prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10;
        
        // calculate text width
        const text = `${prediction.class} - ${Math.round(prediction.score * 100)}%`;
        const textWidth = ctx.measureText(text).width;
        console.log(text, textX, textY);

        // Adjust line width and font size based on scale factor
        ctx.lineWidth = 1.5 * scaleFactor;
        ctx.strokeStyle = color;
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.fillRect(textX, textY - 14 * scaleFactor, textWidth + 20 * scaleFactor, 20 * scaleFactor);
        ctx.fillStyle = 'white';
        ctx.font = `${15 * scaleFactor}px`;
        
        ctx.fillText(text, textX, textY);
    });
}