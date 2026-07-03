# 🚀 CampusPe Localhost Development Guide

## 📋 Project Overview

**CampusPe** is a comprehensive platform connecting students, colleges, and recruiters with the following architecture:

- **Backend API**: Node.js + Express + TypeScript + MongoDB (Port: 5001)
- **Frontend Web**: Next.js + React + TypeScript + Tailwind CSS (Port: 3000)
- **Database**: MongoDB Atlas (Cloud) + Local MongoDB option
- **Architecture**: Monorepo structure with separate API and Web apps

## ✅ Current Status

✅ **Setup Complete**: All dependencies installed and configured  
✅ **API Running**: Backend server active on http://localhost:5001  
✅ **Web Running**: Frontend server active on http://localhost:3000  
✅ **Database Connected**: MongoDB Atlas connection successful  
✅ **Environment Configured**: Local development environment files created  
✅ **Build Working**: TypeScript compilation successful  

## 🛠️ Development Commands

### Start Both Servers (Recommended)
```bash
npm run dev
```

### Start Individual Servers
```bash
# Terminal 1: Start API (Backend)
npm run dev:api

# Terminal 2: Start Web (Frontend)  
npm run dev:web
```

### Other Useful Commands
```bash
# Build everything
npm run build

# Start production servers
npm run start

# API only commands
cd apps/api
npm run build    # Build TypeScript
npm run dev      # Development mode
npm start        # Production mode

# Web only commands
cd apps/web
npm run build    # Build Next.js
npm run dev      # Development mode
npm start        # Production mode
```

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main web application |
| **Backend API** | http://localhost:5001 | REST API server |
| **API Health** | http://localhost:5001/health | Health check endpoint |

## 📁 Project Structure

```
CampusPe_Staging/
├── apps/
│   ├── api/                 # Backend API (Node.js + Express)
│   │   ├── src/             # TypeScript source files
│   │   ├── dist/            # Compiled JavaScript
│   │   ├── .env.local       # Local environment variables
│   │   └── package.json     # API dependencies
│   └── web/                 # Frontend Web (Next.js)
│       ├── pages/           # Next.js pages
│       ├── components/      # React components
│       ├── .env.local       # Local environment variables
│       └── package.json     # Web dependencies
├── package.json             # Root package.json (monorepo)
├── localhost-setup.sh       # Setup script
└── LOCALHOST_DEVELOPMENT_GUIDE.md
```

## 🔧 Environment Configuration

### API Environment (.env.local)
- **NODE_ENV**: development
- **PORT**: 5001
- **MONGODB_URI**: MongoDB Atlas connection (already configured)
- **JWT_SECRET**: Authentication secret
- **CORS_ORIGIN**: http://localhost:3000 (allows frontend access)

### Web Environment (.env.local)
- **NEXT_PUBLIC_API_URL**: http://localhost:5001
- **NODE_ENV**: development
- **PORT**: 3000

## 🗄️ Database

**Current Setup**: MongoDB Atlas (Cloud)
- **Connection**: Automatically configured
- **Database**: campuspe
- **Status**: ✅ Connected and working

**Local MongoDB Option** (Optional):
If you want to use local MongoDB instead:
1. Install MongoDB locally
2. Update `MONGODB_URI` in `apps/api/.env.local`:
   ```
   MONGODB_URI=mongodb://localhost:27017/campuspe
   ```

## 🚀 Features

### User Roles
- **Students**: Resume building, job applications, profile management
- **Colleges**: Student management, recruitment coordination
- **Recruiters**: Job posting, candidate searching, interview scheduling
- **Admin**: Platform management, user approval

### Key Functionality
- **Authentication**: JWT-based with phone/email verification
- **Resume Builder**: AI-powered resume creation and analysis
- **Job Matching**: AI-powered job recommendations
- **Dashboard**: Role-specific comprehensive dashboards
- **File Upload**: Resume and document management
- **Notifications**: Real-time updates and alerts

## 🔍 Testing the Setup

### 1. API Health Check
```bash
curl http://localhost:5001/health
```
Expected response: `{"status": "OK", "message": "API is running"}`

### 2. Frontend Access
Open http://localhost:3000 in your browser
- Should show the CampusPe landing page
- Navigation should work
- Login/Register should be accessible

### 3. API-Frontend Communication
- Register a new student account
- Check if API calls work (check browser Network tab)
- Verify data persistence in database

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Kill processes on ports
sudo lsof -ti:3000 | xargs kill -9  # Frontend
sudo lsof -ti:5001 | xargs kill -9  # Backend
```

**Database Connection Issues**:
- Check internet connection (using MongoDB Atlas)
- Verify MONGODB_URI in environment file
- Check MongoDB Atlas cluster status

**Build Errors**:
```bash
# Clean and rebuild
cd apps/api && rm -rf dist node_modules && npm install && npm run build
cd ../web && rm -rf .next node_modules && npm install && npm run build
```

**Environment Variables Not Loading**:
- Ensure `.env.local` files exist in both `apps/api/` and `apps/web/`
- Restart servers after changing environment variables
- Check file names (`.env.local` not `.env`)

## 🛡️ Security Notes

- JWT secrets are set for development
- MongoDB Atlas credentials are configured
- CORS is set to allow localhost:3000
- All API keys are configured for development

## 📝 Development Workflow

1. **Start Development**: Run `npm run dev` from root
2. **Make Changes**: Edit files in `apps/api/src/` or `apps/web/`
3. **Auto Reload**: Both servers have hot reload enabled
4. **Test Changes**: Check browser for frontend, test API endpoints
5. **Debug**: Use browser dev tools, check terminal logs

## 🚀 Next Steps

1. **Explore the Application**: Visit http://localhost:3000
2. **Create Test Accounts**: Register as different user types
3. **Test Features**: Try resume building, job posting, etc.
4. **Review Code**: Examine the codebase in `apps/api/src/` and `apps/web/`
5. **Customize**: Make changes as needed for your requirements

## 📞 Support

If you encounter any issues:
1. Check the terminal logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB Atlas connection is working
4. Check that all ports (3000, 5001) are available

---

**Status**: ✅ **READY FOR DEVELOPMENT**

Your CampusPe platform is now running locally and ready for development!
