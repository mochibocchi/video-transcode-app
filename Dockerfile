
FROM node:18
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000

# Command to run the application
CMD ["node", "app.js"]
