# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy the private key to the working directory
COPY privatekey.pem /usr/src/app/

# Copy the server certificate and key to the working directory
COPY server.crt /usr/src/app/
COPY server.key /usr/src/app/

# Install application dependencies
RUN npm install

# Copy the rest of the application source code to the container
COPY . .

# Expose the port that the app runs on
EXPOSE 3000

# Command to start the application
CMD ["npm", "start"]

