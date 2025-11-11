# Next.js Frontend - Auth Module

This is a Next.js frontend application built with TypeScript that connects to the backend authentication API.

## Features

- User authentication (Login, Signup)
- OTP verification for signup
- Password reset with OTP
- Google OAuth integration
- Protected routes
- State management with Zustand
- Form validation with React Hook Form and Yup
- Responsive UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- Backend server running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file (already created) with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
next-frontend/
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── forgot-password/   # Forgot password page
│   ├── dashboard/         # Protected dashboard
│   ├── oauth-callback/    # OAuth callback handler
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects)
├── components/            # Reusable components
│   ├── Navbar.tsx
│   ├── LoadingSpinner.tsx
│   └── PasswordStrengthIndicator.tsx
├── lib/                   # Utilities and API client
│   ├── api.ts            # Axios instance
│   └── utils/
│       └── validation.ts # Validation utilities
├── store/                 # State management
│   └── authStore.ts      # Zustand auth store
└── types/                # TypeScript types
    └── index.ts
```

## Backend Connection

The frontend is configured to connect to the backend at `http://localhost:5000/api` by default. Make sure:

1. The backend server is running
2. CORS is properly configured in the backend
3. The `NEXT_PUBLIC_API_URL` environment variable matches your backend URL

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Yup** - Schema validation
- **Axios** - HTTP client
- **js-cookie** - Cookie management
