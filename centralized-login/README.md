# Centralized Login

The unified login portal for the SSO platform. Handles user authentication, registration, password reset, and multi-factor authentication flows.

## 🚀 Features

- **Unified Login**: Single login page for all connected applications
- **Registration**: New user sign-up with email verification
- **Password Reset**: Secure password recovery flow
- **Multi-Factor Authentication**: TOTP-based 2FA support
- **Social Login**: OAuth providers (Google, GitHub, etc.)
- **Session Management**: Manage active sessions
- **Responsive Design**: Mobile-first UI with Framer Motion animations

## 📋 Prerequisites

- Node.js >= 18.x
- Auth Service running on port 4000
- Keycloak running on port 8080

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

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5174`

## 🔧 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm test         # Run tests with Vitest
```

## 🛠️ Tech Stack

- React 19
- Vite
- Material UI 7
- Framer Motion
- TanStack React Query
- React Router 7
- TailwindCSS 4

## 📁 Project Structure

```
centalized-login/
├── src/
│   ├── components/    # UI components
│   ├── pages/         # Page components (Login, Register, etc.)
│   ├── hooks/         # Custom hooks
│   ├── services/      # API services
│   ├── context/       # React context
│   └── utils/         # Utilities
├── public/            # Static assets
└── index.html         # Entry HTML
```

## 📄 License

MIT
