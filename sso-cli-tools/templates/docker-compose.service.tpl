  {{SERVICE_NAME}}:
    build:
      context: ./{{DIRECTORY_NAME}}
      dockerfile: infrastructure/Dockerfile
      args:
        - VITE_CLIENT_KEY={{CLIENT_KEY}}
        - VITE_AUTH_BASE_URL={{AUTH_BASE_URL}}
        - VITE_API_URL={{API_URL}}
        - VITE_ACCOUNT_UI_URL={{ACCOUNT_UI_URL}}
        - VITE_CALLBACK_URL={{CALLBACK_URL}}
    networks:
      - sso-network
