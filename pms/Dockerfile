FROM ubuntu:latest

# Set the working directory in the image
WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Copy the files from the host file system to the image file system
COPY . .

# Install the necessary packages

RUN npm install &&\
    apt-get clean

# Set environment variables
# ENV NAME World

# Run a command to start the application
ENTRYPOINT [ "node" ]
CMD ["server.js"]