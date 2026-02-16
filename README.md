# Enterprise SSO System

A comprehensive, localized Single Sign-On (SSO) solution using Keycloak, Node.js Auth Service, and React clients.
Designed to be fully "dockerized" and runnable locally with zero external dependencies.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- `mkcert` (for local SSL certificates)
  - Linux: `sudo apt install libnss3-tools && brew install mkcert`
  - macOS: `brew install mkcert`
  - Windows: `choco install mkcert`

### Installation
1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd sso-project
    ```

2.  **Run the Setup Script**:
    ```bash
    ./setup.sh
    ```
    This script will:
    - Install `sso-client` CLI globally.
    - Generate local SSL certificates for `*.local.test`.
    - Initialize Keycloak and Databases (restoring full state).
    - Start the entire application stack.

3.  **Access the Applications**:
    - **Admin Console**: [https://admin.local.test](https://admin.local.test)
    - **Account Portal**: [https://account.local.test](https://account.local.test)
    - **Keycloak Admin**: [https://keycloak.local.test:8443](https://keycloak.local.test:8443) (Creds: `admin` / `admin123`)

## 🛠 Developing New Apps

Use the custom CLI to generate new SSO-integrated React apps in seconds:

```bash
# Create a new client folder
mkdir my-new-app
cd my-new-app

# Initialize SSO client
sso-client init
```

Follow the prompts. The CLI will:
1.  Register the client in the Auth Service (and Keycloak).
2.  Generate a Dockerized React app with Auth SDK pre-configured.
3.  Add the app to the main `docker-compose.yml`.

## 🏗 Architecture

- **Gateway (Nginx)**: Terminating SSL at port 443. Routes traffic to services based on subdomains (`auth.`, `admin.`, `account.`).
- **Auth Service**: Node.js backend wrapping Keycloak Admin API. Handles client registration, organization management, and permissions.
- **Email Service**: Standalone microservice for sending transactional emails (Port 4011).
- **Keycloak**: Identity Provider (IdP). Running in a dedicated container.
- **Frontend Clients**:
    - `auth-ui`: Admin dashboard for managing the system.
    - `centralized-login`: User login/profile portal.
    - Your apps: Generated via `sso-client`.

## 📂 Project Structure

- `auth-service/`: Node.js backend.
- `email-service/`: Standalone email microservice.
- `keycloak-setup/`: Keycloak docker config and initial SQL dumps.
- `gateway/`: Nginx reverse proxy config.
- `sso-cli-tools/`: The `sso-client` CLI tool.
- `auth-ui/` & `centralized-login/`: Core frontend apps.
