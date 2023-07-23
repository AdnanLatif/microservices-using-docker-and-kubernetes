# Use the official Node.js 18.x base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the application code
COPY . .

# Command to start the data-service
CMD ["node", "dataReceiver.js"]
