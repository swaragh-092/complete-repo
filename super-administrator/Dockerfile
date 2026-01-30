FROM node:20-alpine

# Set the working directory in the image
WORKDIR /app

RUN apk add --no-cache


# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Run the application
CMD ["node", "server.js"]