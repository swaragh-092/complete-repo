# Auth UI

Admin dashboard for managing users, realms, organizations, and policies in the SSO platform.

## 🚀 Features

- **User Management**: Create, edit, delete users
- **Realm Management**: Configure authentication realms
- **Organization Management**: Multi-tenant organization support
- **Policy Configuration**: Set password policies and security rules
- **Session Monitoring**: View and manage active sessions
- **Audit Logs**: Track authentication events

## 📋 Prerequisites

- Node.js >= 18.x
- Auth Service running on port 4000

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

The app will be available at `http://localhost:5173`

## 🔧 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🛠️ Tech Stack

- React 19
- Vite
- Material UI 7
- TanStack React Query
- React Router 7
- React Hook Form + Yup

## 📁 Project Structure

```
auth-ui/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API service functions
│   ├── context/       # React context providers
│   └── utils/         # Utility functions
├── public/            # Static assets
└── index.html         # Entry HTML
```

## 📄 License

MIT
