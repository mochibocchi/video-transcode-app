Assignment 1 - Web Server - Response to Criteria
================================================

Overview
------------------------------------------------

- **Name:** Timmy Ha
- **Student number:** 10526889
- **Application name:** Web Application Transcode Service
- **Two line description:** A web application that allows users to upload, transcode and download video files.


Core criteria
------------------------------------------------

### Docker image

- **ECR Repository name:** n10526889-assessment-1
- **Video timestamp:** 0:00
- **Relevant files:** Dockerfile
    - 

### Docker image running on EC2

- **EC2 instance ID:** i-0898cfded843f0e9e
- **Video timestamp:** 0:08

### User login functionality

- **One line description:** Hard-coded username/password list.  Using JWTs for sessions.
- **Video timestamp:** 0:22
- **Relevant files:** /routes/auth.js, /public/login.html
    - 

### User dependent functionality

- **One line description:** Files are owned by a user.  Users can only have access to their videos they uploaded/transcoded.
- **Video timestamp:** 2:41
- **Relevant files:**
    - /routes/auth.js
    - /routes/video.js
    - /public/files.html
    - /public/files/javascript/files.js

### Web client

- **One line description:** Single page application using Node.js + Tailswind CSS
- **Video timestamp:** 0:26
- **Relevant files:**
    - /routes/
    - /public/

### REST API

- **One line description:** REST API with endpoints and HTTP methods (GET, POST, etc), and appropriate status codes
- **Video timestamp:** 0:26
- **Relevant files:**
    - /routes/auth.js 
        -   POST /auth/login: Log in with credentials and receive a JWT token.
    - /routes/video.js
        -   POST /video/upload: Upload a video file.
        -   POST /video/transcode: Transcode the uploaded video to a different format.
        -   GET /video/transcode/progress/:jobId: Check the progress of the transcoding.
        -   GET /video/files: Retrieve a list of all uploaded and transcoded files.

### Two kinds of data

#### First kind

- **One line description:** Video files
- **Type:** Unstructured
- **Rationale:** Videos are too large for database.  No need for additional functionality.
- **Video timestamp:** 0:47
- **Relevant files:** 
    - /routes/video.js
    - /public/files.html

#### Second kind

- **One line description:** JWT tokens for user sessions.
- **Type:** Text data (JSON Web Token)
- **Rationale:** To allow users to have user-specific actions like video ownership.
- **Video timestamp:** 2:48
- **Relevant files:**
    - /routes/auth.js
    - /routes/video.js

### CPU intensive task

- **One line description:** Transcoding video files using ffmpeg
- **Video timestamp:** 0:54
- **Relevant files:**
    - /routes/video.js

### CPU load testing method

- **One line description:** Manually transcode multiple videos to generate requests
- **Video timestamp:** 2:06 (initiating multiple transcode requests simultaneously), 2:33 (load test results)
- **Relevant files:**
    - N/A

Additional criteria
------------------------------------------------

### Extensive REST API features

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 


### Use of external API(s)

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 


### Extensive web client features

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 


### Sophisticated data visualisations

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 


### Additional kinds of data

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 


### Significant custom processing

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 


### Live progress indication

- **One line description:** Web client polls for progress info, periodically updated from the ffmpeg command. Dynamically display for each individual transcode request
within its respective card container. Also dynamically display upload progress too.
- **Video timestamp:** 0:55
- **Relevant files:**
    - /public/files.html


### Infrastructure as code

- **One line description:** Not attempted
- **Video timestamp:** 
- **Relevant files:**
    - 


### Other

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 
