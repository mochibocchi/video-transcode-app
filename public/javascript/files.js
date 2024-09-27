// Request a pre-signed URL from the server
async function getUploadURL(filename, fileType) {
    const response = await fetch(`/video/upload-url?filename=${filename}&fileType=${fileType}`);
    const data = await response.json();
    return data.uploadURL;
}

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

function handleVideoUpload(formData, token, fileName) {
    const xhr = new XMLHttpRequest();

    // Create a new upload bar for this file
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'mb-4';

    const uploadBarContainer = document.createElement('div');
    uploadBarContainer.className = 'w-full bg-gray-200 rounded-lg mt-4';

    const uploadBar = document.createElement('div');
    uploadBar.className = 'bg-green-500 text-xs font-medium text-center text-white p-1 rounded-lg';
    uploadBar.style.width = '0%';
    uploadBar.textContent = '0%';

    uploadBarContainer.appendChild(uploadBar);
    uploadContainer.appendChild(uploadBarContainer);

    // Append the new progress bar under the upload form
    document.getElementById('uploadForm').after(uploadContainer);

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            uploadBar.style.width = `${percentComplete}%`;
            uploadBar.textContent = `${Math.round(percentComplete)}%`;
        }
    });

    xhr.addEventListener('loadstart', () => {
        uploadBarContainer.classList.remove('hidden');
    });

    xhr.addEventListener('loadend', () => {
        uploadBar.style.width = '100%';
        uploadBar.textContent = 'Upload Complete!';
        setTimeout(() => {
            uploadContainer.remove();
            loadFiles(); // Reload the file list after upload
        }, 1000); // Remove the progress bar after a brief delay
    });

    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status !== 200) {
                alert('Upload failed!');
                uploadContainer.remove();
            }
        }
    };

    xhr.open('POST', '/video/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const files = document.getElementById('video').files;
    if (files.length === 0) return;

    const file = files[0];
    const filename = file.name;
    const fileType = file.type;

    try {
        // Get the pre-signed URL for this video file
        const uploadURL = await getUploadURL(filename, fileType);

        // Upload the video to S3 directly using the pre-signed URL
        await fetch(uploadURL, {
            method: 'PUT',
            headers: {
                'Content-Type': fileType
            },
            body: file
        });

        alert('Video uploaded successfully!');
        loadFiles();

    } catch (error) {
        console.error('Error uploading video:', error);
        alert('Error uploading video');
    }
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

function renderFileList(files, elementId) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = '';

    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-white p-4 rounded-lg shadow-md';

        // Create a button to get a pre-signed URL for downloading the file
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.onclick = async () => {
            const response = await fetch(`/video/download-url?filename=${file.filename}`);
            const data = await response.json();
            window.location.href = data.downloadURL;  // Redirect to the pre-signed URL for download
        };

        li.appendChild(downloadButton);
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
                loadFiles();
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
