  # ============================================================================
  # {{APP_HUMAN_NAME}}
  # ============================================================================
  server {
    listen 443 ssl;
    server_name {{CLIENT_KEY}}.{{DOMAIN}};

    location / {
      set $upstream_{{SAFE_SERVICE_NAME}} http://{{SERVICE_NAME}}:80;
      proxy_pass $upstream_{{SAFE_SERVICE_NAME}};
    }
  }
