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
        const videoUrl = isTranscoded ? `/transcoded/${file.filename}` : `/uploads/${file.filename}`;
        const li = document.createElement('li');
        li.className = 'flex flex-col bg-white p-4 rounded-lg shadow-md space-y-4';

        li.innerHTML = `
            <span class="text-gray-700 mr-auto font-bold">${file.filename}</span>
            <video controls class="w-full h-auto rounded-lg">
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="flex flex-col space-y-2">
                <div class="flex justify-end space-x-2">
                    <a href="/video/download/${file.filename}" target="_blank" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Download</a>
                    ${!isTranscoded ? `<button onclick="transcode('${file.filename}')" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Transcode</button>` : ''}
                </div>
                ${!isTranscoded ? `
                <div class="w-full bg-gray-200 rounded-lg hidden" id="transcodingBarContainer-${file.filename}">
                    <div class="bg-green-500 text-xs font-medium text-center text-white p-1 rounded-lg" id="transcodingBar-${file.filename}" style="width: 0%;">0%</div>
                </div>` : ''}
            </div>
        `;

        listElement.appendChild(li);
    });
}

async function transcode(filename, elementId) {
    console.log('Starting transcoding for:', filename);
    const transcodingBarContainer = document.getElementById(`transcodingBarContainer-${filename}`);
    const transcodingBar = document.getElementById(`transcodingBar-${filename}`);
    transcodingBarContainer.classList.remove('hidden');
    
    const format = prompt("Enter the desired format (e.g., mp4, avi, mkv):");
    if (!format) {
        alert("No format specified. Transcoding canceled.");
        transcodingBarContainer.classList.add('hidden');
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await apiRequest('/video/transcode', 'POST', token, JSON.stringify({ filename, format }));
        if (response.ok) {
            const jobId = filename;
            console.log('Transcoding started, polling for progress...');
            pollProgress(jobId, transcodingBar, transcodingBarContainer, elementId);
        } else {
            alert('Transcoding failed!');
            transcodingBarContainer.classList.add('hidden');
        }
    } catch (error) {
        console.error('Transcoding error:', error.message);
        alert(`Transcoding failed! ${error.message}`);
        transcodingBarContainer.classList.add('hidden');
    }
}

async function pollProgress(jobId, transcodingBar, transcodingBarContainer, elementId) {
    let completed = false;
    while (!completed) {
        try {
            const response = await apiRequest(`/video/transcode/progress/${jobId}`, 'GET');
            const data = await response.json();

            let progress = data.progress || 0;
            transcodingBar.style.width = `${progress}%`;
            transcodingBar.textContent = `${Math.round(progress)}%`;

            if (progress >= 100) {
                completed = true;
                transcodingBar.style.width = '100%'; 
                transcodingBar.textContent = '100%';
                
                transcodingBarContainer.classList.add('hidden');
                transcodingBar.style.width = '0%';
                transcodingBar.textContent = '0%';
                loadFiles(); // Reload files to reflect the transcoded file
            }
        } catch (error) {
            console.error('Error polling progress:', error.message);
            alert('Failed to poll transcoding progress.');
            transcodingBarContainer.classList.add('hidden');
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms
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
