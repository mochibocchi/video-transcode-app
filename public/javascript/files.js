// Utility function to handle API requests
async function apiRequest(url, method, token, body = null, contentType = 'application/json') {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    if (contentType) {
        headers['Content-Type'] = contentType;
    }

    const response = await fetch(url, {
        method,
        headers,
        body,
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Error: ${response.statusText}\n${errorMessage}`);
    }

    return response;
}

function handleVideoUpload(formData, token) {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            const loadingBar = document.getElementById('loadingBar');
            loadingBar.style.width = `${percentComplete}%`;
            loadingBar.textContent = `${Math.round(percentComplete)}%`;
        }
    });

    xhr.addEventListener('loadstart', () => {
        document.getElementById('loadingBarContainer').classList.remove('hidden');
    });

    xhr.addEventListener('loadend', () => {
        document.getElementById('loadingBarContainer').classList.add('hidden');
        document.getElementById('loadingBar').style.width = '0%';
        document.getElementById('loadingBar').textContent = '0%';
    });

    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                alert('Upload successful!');
                loadFiles();
            } else {
                alert('Upload failed!');
            }
        }
    };

    xhr.open('POST', '/video/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
}

document.getElementById('uploadForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const video = document.getElementById('video').files[0];
    const formData = new FormData();
    formData.append('video', video);
    const token = localStorage.getItem('token');
    handleVideoUpload(formData, token);
});

async function loadFiles() {
    const token = localStorage.getItem('token');
    try {
        const response = await apiRequest('/video/files', 'GET', token);
        const files = await response.json();

        renderFileList(files.uploadedFiles, 'uploadedList');
        renderFileList(files.transcodedFiles, 'transcodedList', true);

    } catch (error) {
        alert('Failed to load files!');
    }
}

function renderFileList(files, elementId, isTranscoded = false) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = '';
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-white p-4 rounded-lg shadow-md';
        li.innerHTML = `
            <span class="text-gray-700 mr-auto">${file.filename}</span>
            <div class="flex space-x-2">
                <a href="/video/download/${file.filename}" target="_blank" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Download</a>
                ${!isTranscoded ? `<button onclick="transcode('${file.filename}')" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Transcode</button>` : ''}
            </div>
        `;
        listElement.appendChild(li);
    });
}

async function transcode(filename) {
    const format = prompt("Enter the desired format (e.g., mp4, avi, mkv):");
    if (!format) {
        alert("No format specified. Transcoding canceled.");
        return;
    }

    const token = localStorage.getItem('token');
    try {
        await apiRequest('/video/transcode', 'POST', token, JSON.stringify({ filename, format }));

        alert('Transcoding finished successfully!');
        const transcodedFilename = `${filename.split('.').slice(0, -1).join('.')}.${format}`;
        appendTranscodedFile(transcodedFilename);

    } catch (error) {
        alert(`Transcoding failed! ${error.message}`);
    }
}

function appendTranscodedFile(transcodedFilename) {
    const transcodedList = document.getElementById('transcodedList');
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center bg-white p-4 rounded-lg shadow-md';
    li.innerHTML = `
        <span class="text-gray-700 mr-auto">${transcodedFilename}</span>
        <a href="/video/download/${transcodedFilename}" target="_blank" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Download</a>
    `;
    transcodedList.appendChild(li);
}

window.onload = loadFiles;
