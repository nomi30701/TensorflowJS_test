let coco;
const imgel = document.getElementById('imgel-objdetect');
const cocoSsd_state = document.getElementById('coco-state');
const upload_btn_coco = document.getElementById('input-openImg-coco');
const camera_btn_coco = document.getElementById('input-camera-coco');
const obj_canvas = document.getElementById('objdetect-canvas');

async function load_coco() {
    cocoSsd_state.textContent = 'Loading Coco-SSD..';  // show state
    cocoSsd_state.style.color = 'red';
    coco = await cocoSsd.load();
    model_loaded = true;
    cocoSsd_state.textContent = 'Successfully loaded model';  // show state
    cocoSsd_state.style.color = 'green';
    upload_btn_coco.disabled = false; 
    camera_btn_coco.disabled = false; 
}

// if upload img -> predict and draw bounding box
async function handleFileChange(event) {
    const file = event.target.files[0];
    imgel.src = URL.createObjectURL(file);
    await imgel.decode();
    const predictions = await coco.detect(imgel);
    drawBoundingBox(predictions);
}
upload_btn_coco.addEventListener('change', handleFileChange);
camera_btn_coco.addEventListener('change', handleFileChange);

function drawBoundingBox(predictions) {
    obj_canvas.width = imgel.width;
    obj_canvas.height = imgel.height;

    const ctx = obj_canvas.getContext('2d');

    ctx.drawImage(imgel, 0, 0);
    predictions.forEach(prediction => {
        // Generate a random color for each bounding box
        const {r, g, b} = getRandomRgbColor();
        const color = `rgb(${r}, ${g}, ${b})`;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
        ctx.fillRect(
            prediction.bbox[0],
            prediction.bbox[1],
            prediction.bbox[2],
            prediction.bbox[3]
        );

        ctx.rect(
            prediction.bbox[0],
            prediction.bbox[1],
            prediction.bbox[2],
            prediction.bbox[3]
        );
        // Calculate text position
        let textX = prediction.bbox[0];
        let textY = prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10;
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillRect(textX, textY - 15, 150, 20);
        ctx.fillStyle = 'white';
        ctx.font = '15px Arial';
        
        ctx.fillText(
            `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
            textX,
            textY
        );
    });
}

function getRandomRgbColor() {
    var r = Math.floor(Math.random() * 256);          
    var g = Math.floor(Math.random() * 256);          
    var b = Math.floor(Math.random() * 256);          
    return {r, g, b};   
}