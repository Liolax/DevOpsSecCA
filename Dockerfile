# Use a lightweight Node.js runtime as the base image
FROM node:14-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose standard ports for Azure: 80 (HTTP) and 443 (HTTPS)
EXPOSE 80 443

# Command to start the application
CMD ["npm", "start"]
