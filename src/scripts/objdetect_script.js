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

    ctx.drawImage(src, 0, 0);
    predictions.forEach(predict => {
        ctx.beginPath();
        ctx.rect(
            predict.bbox[0],
            predict.bbox[1],
            predict.bbox[2],
            predict.bbox[3]
        );
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgb(255, 0, 255)`;
        ctx.stroke();
        
        // Draw text and background
        ctx.fillStyle = `rgb(255, 0, 255)`;
        ctx.font = '16px Arial';
        const text = `${predict.class} | ${Math.floor((predict.score * 100))}%`;
        const textWidth = ctx.measureText(text).width;
        const textHeight = parseInt(ctx.font, 10);
        ctx.fillRect(predict.bbox[0] - 1, predict.bbox[1] - textHeight - 4, textWidth + 4, textHeight + 4);
        ctx.fillStyle = 'white';
        ctx.fillText(text, predict.bbox[0], predict.bbox[1] - 5);
    });
}