# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy the SSL certificate files if you're using them (optional if using Azure-managed certificates)
COPY privatekey.pem ./
COPY server.crt ./
COPY server.key ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code to the container
COPY . .

# Expose standard ports expected by Azure App Service (HTTP on 80, HTTPS on 443)
EXPOSE 80 443

# Command to start the application
CMD ["npm", "start"]
