# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy the SSL certificate files if needed (optional for Azure-managed SSL)
COPY privatekey.pem ./
COPY server.crt ./
COPY server.key ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code to the container
COPY . .

# Expose standard ports for Azure: 80 (HTTP) and 443 (HTTPS)
EXPOSE 80 443

# Command to start the application
CMD ["npm", "start"]
