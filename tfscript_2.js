let net;
const show_result = document.createElement('div');
const container_classifier = document.getElementById('container_classifier');
const classifier_btn = document.getElementById('classifier_btn');
const mobilenet_state = document.getElementById('mobilenet_state');


// Load model bnt
async function load_mobilenet() {
    classifier_btn.disabled = true; // disable btn
    
    mobilenet_state.textContent = 'Loading mobilenet..';  // show state
    net = await mobilenet.load(); 
    mobilenet_state.textContent = 'Successfully loaded model';  // show state
    
    classifier_btn.disabled = false; // enable btn
}

async function app() {
    show_result.innerHTML = ''; // clean text

    // Make a prediction through the model on our image.
    const imgEl = document.getElementById('img');
    const result = await net.classify(imgEl);
    console.log(result);
    
    // show to page
    result.forEach((obj, index) => {
        const className = obj.className;
        const probability = (obj.probability * 100).toFixed(2);
        const firstClassName = className.split(',')[0].trim();
        show_result.innerHTML += `
        <p>className: ${firstClassName} | probability: ${probability}%</p>
        `;
    });
    show_result.classList.add('Info_container');
    container_classifier.appendChild(show_result);
}

// if import img file
document.getElementById('file').addEventListener('change', function(event) {
    const file = event.target.files[0]; // get file
    const img = document.getElementById('img'); // get <img>
    
    // check file was load
    if (file) {
        // "FileReader" for read file
        const reader = new FileReader();
        
        // if load
        reader.onload = function(e) {
            // load to <img>
            img.src = e.target.result;
        }
        
        reader.readAsDataURL(file); // 讀取文件並轉換為 DataURL
    }
});

