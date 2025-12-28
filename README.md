# Task Manager - Daily Express

A modern task management and scheduling application built with Next.js, Firebase, and TypeScript.

## 🚀 Live Site

Currently deployed at: [dailyexpress.netlify.app](https://dailyexpress.netlify.app)

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.7
- **Language**: TypeScript
- **UI**: React 19.2.0, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Netlify

## 📋 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun
- Firebase project with Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd task-manger
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy the values from `ENV_SETUP.md`
   - Create a `.env.local` file with your Firebase credentials
   - See `ENV_SETUP.md` for complete list of required variables

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 Environment Variables

**CRITICAL**: This application requires environment variables to function. See:
- `ENV_SETUP.md` - Complete environment variable documentation
- `QUICK_FIX_GUIDE.md` - Quick reference for immediate setup

### Required Variables

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_SERVICE_ACCOUNT` (server-side)

## 🚀 Deployment

### Deploying to Netlify

1. **Set Environment Variables**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add all variables from `ENV_SETUP.md`

2. **Deploy**
   - Push to your repository (auto-deploy)
   - Or trigger manual deploy from Netlify dashboard

3. **Verify**
   - Follow the `DEPLOYMENT_CHECKLIST.md` for complete verification steps

For detailed deployment instructions, see:
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `PRODUCTION_READINESS.md` - Production readiness report

## 📚 Documentation

- `ENV_SETUP.md` - Environment variable setup guide
- `PRODUCTION_READINESS.md` - Detailed production analysis
- `QUICK_FIX_GUIDE.md` - Quick reference for fixes
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `CHANGES_SUMMARY.md` - Summary of production fixes

## 🔒 Security

- All Firebase credentials are stored in environment variables
- Security headers configured in `next.config.ts`
- Error boundaries prevent app crashes
- API routes include proper authentication and validation

## 🐛 Troubleshooting

### Build Errors
- Verify all environment variables are set
- Check Firebase configuration
- Review `PRODUCTION_READINESS.md` for known issues

### Runtime Errors
- Check browser console for errors
- Verify Firebase Security Rules
- Check Netlify function logs

## 📝 Features

- User authentication (Email/Password & Google OAuth)
- Task management (Create, Read, Update, Delete)
- Calendar integration
- Day planning
- Integrations with Google Calendar, Notion, and Slack
- Dark mode support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

[Add your license here]

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
