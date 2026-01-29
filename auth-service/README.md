# Auth Service

Backend authentication and authorization service with Keycloak integration.

## 🚀 Features

- OAuth2/OIDC authentication via Keycloak
- JWT token validation and refresh
- Multi-tenant realm management
- User, role, and permission management
- Session management with Redis
- Email service for invitations
- Audit logging

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL 15+
- Redis (optional, for sessions)
- Keycloak 24+

## ⚙️ Setup

### 1. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 4. Start Server

```bash
# Development
npm start

# Production
npm run start:prod
```

## 📁 Project Structure

```
auth-service/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── migrations/      # Database migrations
├── models/          # Sequelize models
├── routes/          # API route definitions
├── services/        # Business logic services
├── utils/           # Utility functions
├── validators/      # Request validation
└── server.js        # Application entry point
```

## 🔌 API Endpoints

| Method | Endpoint         | Description        |
| ------ | ---------------- | ------------------ |
| POST   | `/auth/login`    | User login         |
| POST   | `/auth/logout`   | User logout        |
| POST   | `/auth/refresh`  | Refresh token      |
| GET    | `/users`         | List users         |
| GET    | `/realms`        | List realms        |
| GET    | `/organizations` | List organizations |

## 🧪 Scripts

```bash
npm start        # Start with nodemon (dev)
npm run start:prod  # Start for production
npm run lint     # Run ESLint
npm run lint:fix # Fix lint issues
npm run format   # Format with Prettier
npm run db:migrate  # Run migrations
npm run db:seed  # Run seeders
```

## 📄 License

MIT
