document.getElementById('imageUpload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgUrl = e.target.result;

            const originalCanvas = document.getElementById('originalImageCanvas');
            const normalMapCanvas = document.getElementById('normalMapCanvas');

            createNormalMap(imgUrl, originalCanvas, normalMapCanvas);
        };
        reader.readAsDataURL(file);
    }
});

// Synchronize slider with input text
function setupSliderInput(sliderId, inputId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);

    slider.addEventListener('input', () => {
        input.value = slider.value;
        updateNormalMap();
    });

    input.addEventListener('input', () => {
        slider.value = input.value;
        updateNormalMap();
    });
}

setupSliderInput('strengthRange', 'strengthValue');
setupSliderInput('depthRange', 'depthValue');
setupSliderInput('blueRange', 'blueValue');
setupSliderInput('sharpnessRange', 'sharpnessValue');

// Function to load an image into a canvas
function loadImageToCanvas(url, canvas, callback) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = url;

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        callback();
    };
}

// Function to get pixel data from the canvas
function getImageData(canvas) {
    const ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Function to set pixel data back to the canvas
function putImageData(canvas, imageData) {
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
}

// Function to convert a height map to a normal map
function heightMapToNormalMap(heightMapData, width, height, options) {
    const normalMapData = new ImageData(width, height);

    const { strength, depth, blueAdjust } = options;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const index = (y * width + x) * 4;

            const left = heightMapData[(y * width + (x - 1)) * 4];
            const right = heightMapData[(y * width + (x + 1)) * 4];
            const top = heightMapData[((y - 1) * width + x) * 4];
            const bottom = heightMapData[((y + 1) * width + x) * 4];

            const dx = ((right - left) / 255.0) * strength;
            const dy = ((bottom - top) / 255.0) * strength;
            const dz = depth;

            const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const nx = dx / length;
            const ny = dy / length;
            const nz = dz / length * blueAdjust;

            normalMapData.data[index] = Math.floor((nx + 1) * 127.5);
            normalMapData.data[index + 1] = Math.floor((ny + 1) * 127.5);
            normalMapData.data[index + 2] = Math.floor((nz + 1) * 127.5);
            normalMapData.data[index + 3] = 255;
        }
    }

    return normalMapData;
}

// Main function to create a normal map from an image
function createNormalMap(imageUrl, originalCanvas, normalMapCanvas) {
    loadImageToCanvas(imageUrl, originalCanvas, () => {
        // Synchronize the normal map canvas size with the original image canvas size
        normalMapCanvas.width = originalCanvas.width;
        normalMapCanvas.height = originalCanvas.height;

        updateNormalMap();
    });
}

// Function to update the normal map based on current values
function updateNormalMap() {
    const originalCanvas = document.getElementById('originalImageCanvas');
    const imageData = getImageData(originalCanvas);

    const options = {
        strength: parseFloat(document.getElementById('strengthRange').value),
        depth: parseFloat(document.getElementById('depthRange').value),
        blueAdjust: parseFloat(document.getElementById('blueRange').value)
    };

    const normalMapCanvas = document.getElementById('normalMapCanvas');
    const normalMapData = heightMapToNormalMap(imageData.data, originalCanvas.width, originalCanvas.height, options);
    putImageData(normalMapCanvas, normalMapData);

    // Generate Base64 string and log it
    const base64NormalMap = normalMapCanvas.toDataURL();
    logNormalMap(base64NormalMap);
}

// Reset button functionality
document.getElementById('resetButton').addEventListener('click', () => {
    document.getElementById('strengthRange').value = 5;
    document.getElementById('depthRange').value = 1;
    document.getElementById('blueRange').value = 1;
    document.getElementById('sharpnessRange').value = 5;

    document.getElementById('strengthValue').value = 5;
    document.getElementById('depthValue').value = 1;
    document.getElementById('blueValue').value = 1;
    document.getElementById('sharpnessValue').value = 5;

    updateNormalMap();
});

function logNormalMap(base64Image) {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleString();

    const logEntry = document.createElement('div');
    logEntry.innerHTML = `<strong>${timestamp}</strong>: <img src="${base64Image}" style="max-width: 100px; border: 1px solid #ccc; margin-top: 5px;" alt="Normal Map">`;

    logContainer.prepend(logEntry); // Add new log entry at the top
}
