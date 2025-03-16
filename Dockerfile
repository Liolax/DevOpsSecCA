# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy the private key and server certificate to the working directory
COPY privatekey.pem ./
COPY server.crt ./
# Copy server.key
COPY server.key ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code to the container
COPY . .

# Expose the ports that the application listens on
EXPOSE 8080 8443

# Command to start the application
CMD ["npm", "start"]
