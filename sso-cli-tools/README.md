# SSO CLI Tools

Command-line interface for SSO client integration and authentication flows.

## 🚀 Features

- **Authentication Flows**: Login, logout, token refresh
- **Configuration Management**: Manage client configurations
- **Token Operations**: Validate and decode tokens
- **Multi-Organization Support**: Handle organization selection flows
- **Workspace Support**: SSO across multiple workspaces
- **OpenTelemetry Integration**: Built-in tracing support

## 📦 Installation

### From npm

```bash
npm install -g @spidy092/sso-client-cli
```

### From source

```bash
git clone <repository-url>
cd sso-cli-tools
npm install
npm link
```

## ⚙️ Configuration

Create a configuration file `sso-client.config.json`:

```json
{
  "authServiceUrl": "http://localhost:4000",
  "keycloakUrl": "http://localhost:8080",
  "clientId": "my-client",
  "realm": "my-realm"
}
```

Or use environment variables:

```bash
export SSO_AUTH_SERVICE_URL=http://localhost:4000
export SSO_KEYCLOAK_URL=http://localhost:8080
```

## 🔧 Usage

### Login

```bash
sso-client login
```

### Logout

```bash
sso-client logout
```

### Get Token

```bash
sso-client token
```

### Validate Token

```bash
sso-client validate <token>
```

### Configuration

```bash
# Initialize config
sso-client init

# Show current config
sso-client config show
```

## 📁 Project Structure

```
sso-cli-tools/
├── bin/               # CLI entry point
├── lib/               # Core library functions
├── templates/         # Code generation templates
├── tests/             # Test files
├── types/             # TypeScript definitions
└── docs/              # Documentation
```

## 📚 Documentation
## Session Architecture

This project generates applications that follow a **Keycloak-Authoritative** session model. Frontend timeouts are removed in favor of reacting to Keycloak's session state.

See [SESSION.md](./SESSION.md) for:
-   Configuration details (buffer times, validation intervals).
-   Debug Panel legend.
-   Troubleshooting guide.
- **[Organization & Workspace Guide](docs/ORGANIZATION_WORKSPACE_GUIDE.md)** - Complete A-to-Z guide covering organization models, workspace integration, and user flows
- **[Configuration Guide](docs/configuration-guide.md)** - Detailed configuration options
- **[Authentication Flows](docs/SSO_CLI_AUTHENTICATION_FLOWS_REPORT.md)** - Authentication flow diagrams and explanations

## 🧪 Testing

```bash
npm test               # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## 📄 License

MIT
