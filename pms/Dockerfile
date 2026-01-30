# Use lightweight Alpine-based Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install only if we need native dependencies
RUN apk add --no-cache wget

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Run the application
CMD ["node", "server.js"]