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
// async function app() {
//     show_result.innerHTML = ''; // clean text

//     if (isCameraActive) {
//         const webcam = await tf.data.webcam(webcamElement);
//         while (true) {
//             const img = await webcam.capture();
//             const result = await net.classify(img);
            
//             let htmlContent = '';
//             result.forEach((obj, _) => {
//                 const className = obj.className;
//                 const probability = (obj.probability * 100).toFixed(2);
//                 const firstClassName = className.split(',')[0].trim();
//                 htmlContent += `
//                 <p>Class: <span style="color: blue">${firstClassName}</span> | Prob: <span style="color: red">${probability}%</span></p>
//                 `;
//             });
//             show_result.innerHTML = htmlContent;

//             img.dispose(); //  釋放圖像內存
//             await tf.nextFrame(); // 等待下一個 frame
//         }
//     }
//     else{
//         // Make a prediction through the model on our image.
//         const imgEl = document.getElementById('img');
//         const result = await net.classify(imgEl);

//         // show to page
//         let htmlContent = '';
//         result.forEach((obj, _) => {
//             const className = obj.className;
//             const probability = (obj.probability * 100).toFixed(2);
//             const firstClassName = className.split(',')[0].trim();
//             htmlContent += `
//             <p>Class: <span style="color: blue">${firstClassName}</span> | Prob: <span style="color: red">${probability}%</span></p>
//             `;
//         });
//         show_result.innerHTML = htmlContent;
    
//         show_result.classList.add('Info_container');
//         classifier.appendChild(show_result);
//     }
// }

async function app() {
    show_result.innerHTML = ''; // clean text

    const generateHtmlContent = (result) => {
        let htmlContent = '';
        result.forEach((obj) => {
            const className = obj.className;
            const probability = (obj.probability * 100).toFixed(2);
            const firstClassName = className.split(',')[0].trim();
            htmlContent += `
            <p>Class: <span style="color: blue">${firstClassName}</span> | Prob: <span style="color: red">${probability}%</span></p>
            `;
        });
        return htmlContent;
    }

    if (isCameraActive) {
        const webcam = await tf.data.webcam(webcamElement);
        while (isCameraActive) {
            const img = await webcam.capture();
            const result = await net.classify(img);
            show_result.innerHTML = generateHtmlContent(result);
            img.dispose(); //  Release image memory
            await tf.nextFrame(); // Wait for the next frame
        }
        webcam.stop(); // Stop the webcam when not in use
    }
    else {
        const imgEl = document.getElementById('img');
        const result = await net.classify(imgEl);
        show_result.innerHTML = generateHtmlContent(result);
        show_result.classList.add('Info_container');
        classifier.appendChild(show_result);
    }
}

// media toggle
var isCameraActive = false;
function toggleCameraMode() {
    if (isCameraActive) {
        // If the camera is active, switch back to file input and image
        document.getElementById('media-container').innerHTML = `
            <input type="file" id="file" accept="image/jpeg, image/png"><br>
            <img id="img" src="./JlUvsxa.jpg" width="227" height="227">
        `;
        isCameraActive = false;
    } else {
        document.getElementById('media-container').innerHTML = '<video autoplay playsinline muted id="webcam" width="224" height="224"></video>';
        isCameraActive = true;
    }
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
