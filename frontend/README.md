# Student Dashboard - Frontend

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend running on http://localhost:5000

### Installation

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file (optional):**
```bash
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

**Development mode:**
```bash
npm run dev
```

Application will open at `http://localhost:3000`

**Build for production:**
```bash
npm run build
```

Output files will be in `dist/` directory.

**Preview production build:**
```bash
npm run preview
```

### Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.jsx       # Main layout with sidebar
│   │   ├── KPICard.jsx      # KPI metric cards
│   │   └── LoadingSkeleton.jsx
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx    # Home page with KPIs
│   │   ├── StudentAnalytics.jsx
│   │   ├── StudentDetails.jsx
│   │   ├── DepartmentAnalytics.jsx
│   │   ├── DetainedStudents.jsx
│   │   ├── UploadDataset.jsx
│   │   └── Reports.jsx
│   ├── services/
│   │   └── api.js          # API calls
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── package.json
└── index.html
```

### Features

#### 1. Dashboard
- Real-time KPI metrics
- Student distribution charts
- Attendance analysis
- Performance overview
- Department filtering

#### 2. Student Analytics
- Complete student list with pagination
- Search by USN or name
- Filter by department, semester, section
- Individual student profile with detailed metrics
- Subject-wise performance radar chart

#### 3. Department Analytics
- Department-wise comparison
- Semester-wise trend analysis
- Performance metrics per department
- GPA and attendance distribution

#### 4. Detained Students
- Automatic list of students with <75% attendance
- Contact information for parents
- Export to Excel/PDF
- Department filtering
- Detention reason display

#### 5. Upload Dataset
- Drag-and-drop file upload
- Excel (.xlsx) and CSV support
- Data validation
- Error reporting
- Clear all data option

#### 6. Reports & Export
- Export all students to Excel
- Export detained students to Excel/PDF
- Comprehensive student data
- Multiple export formats

### Key Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - API calls
- **React Toastify** - Notifications

### Configuration

#### Vite Server (vite.config.js)
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

#### Tailwind CSS
Custom colors:
- Navy: `#001f3f`
- Cyan: `#0EA5E9`
- Purple: `#A855F7`

#### API Integration
All API calls are in `src/services/api.js`:
- `studentAPI` - Student CRUD operations
- `uploadAPI` - File uploads
- `analyticsAPI` - Dashboard analytics
- `exportAPI` - Report generation

### Component Usage Examples

**KPI Card:**
```jsx
<KPICard
  title="Total Students"
  value={300}
  icon={Users}
  color="blue"
  trend={5}
/>
```

**Loading Skeleton:**
```jsx
<LoadingSkeleton count={5} />
```

### Styling with Tailwind

Utility classes used:
- `bg-gradient-to-br` - Gradient backgrounds
- `shadow-lg` - Box shadows
- `rounded-lg` - Border radius
- `transition-colors` - Smooth transitions
- `hover:bg-gray-50` - Hover effects

Custom animations:
- `animate-fade-in` - Fade in effect
- `animate-slide-up` - Slide up effect

### Deployment

#### Deploy to Vercel

1. Connect GitHub repository
2. Configure environment variables:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```
3. Deploy

#### Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder

3. Configure environment variables in Netlify dashboard

#### Environment Variables

For production, set:
```
VITE_API_URL=https://api.yourdomain.com/api
```

### Performance Optimization

- Code splitting with React Router
- Lazy loading with Recharts
- Optimized animations
- Memoized components
- Efficient API calls
- Image optimization

### Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Troubleshooting

**API connection error:**
- Ensure backend is running on port 5000
- Check VITE_API_URL in .env
- Verify CORS settings in backend

**Vite port conflict:**
- Change port in vite.config.js
- Or kill process using port 3000

**Module not found:**
- Run `npm install` again
- Clear cache: `npm cache clean --force`

**Build errors:**
- Clear `node_modules`: `rm -rf node_modules`
- Reinstall: `npm install`
- Try: `npm run build` again

### Development Tips

- Use React DevTools browser extension
- Enable Redux DevTools for state inspection
- Use console.log for debugging
- Check Network tab for API calls
- Use Lighthouse for performance audit

### Assets & Icons

Using:
- `lucide-react` for icons (20x20 default)
- Tailwind CSS for styling
- Placeholder images via `placeholder.com`

### Code Quality

- ESLint ready
- Prettier compatible
- Clean component structure
- Reusable utilities
- Documented functions

### Contributing Guidelines

1. Create feature branches
2. Follow component structure
3. Use meaningful commit messages
4. Test before pushing
5. Update documentation

### License

MIT
