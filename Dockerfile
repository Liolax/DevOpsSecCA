# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Copy the SSL certificate files if you're using them (not typically needed if Azure manages SSL)
COPY privatekey.pem ./
COPY server.crt ./
COPY server.key ./

# Install dependencies
RUN npm install

# Copy the remaining application source code into the container
COPY . .

# Expose standard ports (80 for HTTP and 443 for HTTPS)
EXPOSE 80 443

# Commence the application startup
CMD ["npm", "start"]
