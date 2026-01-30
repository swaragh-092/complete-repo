# for nignx
FROM nginx:alpine

WORKDIR /etc/nginx

# Install required tools
RUN apk add --no-cache bash curl


RUN mkdir -p /var/log/nginx

# Copy configs
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY certs/ /etc/nginx/certs/
COPY snippets/ /etc/nginx/snippets/

EXPOSE 80 443

# if using openresty
# CMD ["openresty", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]
#     "openresty",            # Start OpenResty (NGINX + LuaJIT)
#     "-c", "/etc/nginx/nginx.conf",  # Use custom NGINX configuration #This by commend helps to stop if there is error(so that we come to know error)
#     "-g", "daemon off;"     # Keep NGINX in foreground for Docker


CMD ["nginx", "-g", "daemon off;"]
