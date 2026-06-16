# 🚀 Quick Setup Guide

## One-Time Setup

### Step 1: Database Setup
```bash
# If using local MongoDB
mongod

# If using MongoDB Atlas, note your connection string
```

### Step 2: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your MongoDB URI and PORT.

```bash
# Start backend server
npm run dev

# In another terminal, seed sample data
node scripts/seedDatabase.js
```

Backend will be running on `http://localhost:5000`

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install

# Start frontend development server
npm run dev
```

Frontend will be running on `http://localhost:3000`

## Regular Development Workflow

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Terminal 3 - MongoDB (if local)
```bash
mongod
```

---

## Key URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main application |
| Backend API | http://localhost:5000 | API endpoints |
| MongoDB | mongodb://localhost:27017 | Database |

---

## Important Files

### Backend
- `server.js` - Main server file
- `.env` - Environment variables
- `models/Student.js` - Database schema
- `routes/` - API endpoints
- `scripts/seedDatabase.js` - Sample data generator

### Frontend
- `src/App.jsx` - Main app component
- `src/pages/` - Page components
- `src/services/api.js` - API calls
- `vite.config.js` - Build config
- `tailwind.config.js` - Styling config

---

## Common Commands

### Backend
```bash
npm run dev          # Development mode
npm start            # Production mode
npm install          # Install dependencies
node scripts/seedDatabase.js  # Generate sample data
```

### Frontend
```bash
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build
npm install          # Install dependencies
```

---

## Features Checklist

After setup, verify these features work:

- [ ] Dashboard displays KPI metrics
- [ ] Student list shows with pagination
- [ ] Can search/filter students
- [ ] View individual student details
- [ ] See department comparisons
- [ ] View detained students list
- [ ] Upload Excel file works
- [ ] Export to Excel/PDF works
- [ ] Charts display correctly
- [ ] Mobile responsive design

---

## Troubleshooting Quick Fixes

### Port Already in Use
```bash
# Change in .env (backend)
PORT=5001

# Or kill process
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Failed
```bash
# Check if running (local)
mongod

# Or update MONGODB_URI in .env for Atlas
```

### Module Not Found
```bash
cd backend  (or frontend)
rm -rf node_modules
npm install
```

### API Not Responding
1. Check if backend is running
2. Verify .env configuration
3. Check browser network tab
4. Check backend console for errors

---

## Sample Data

After `seedDatabase.js` runs, you'll have:
- 300 students
- 5 departments (CS, Electronics, Mechanical, Civil, Electrical)
- 8 semesters
- Mixed attendance (50-100%)
- Auto-flagged detained students

---

## Next Steps

1. ✅ Complete initial setup
2. ✅ Verify all features working
3. ✅ Upload your own student data
4. ✅ Customize styling (colors, fonts)
5. ✅ Add more features
6. ✅ Deploy to production

---

## Production Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Render/Railway)
1. Push to GitHub
2. Connect service
3. Set env variables
4. Deploy

---

## Support & Help

- Check README.md for detailed docs
- Review backend/README.md for API details
- Check frontend/README.md for component info
- Review error messages in console
- Check browser Network tab for API calls

---

**Happy Dashboard Building! 🎉**

Questions? Check the main README.md file.
