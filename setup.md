# Skill Swap Platform Setup Guide 🚀

This guide will help you set up the complete Skill Swap Platform for your hackathon.

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed
- Git installed

## Quick Setup

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: http://localhost:8000
API documentation: http://localhost:8000/docs

### 2. Frontend Setup (React)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at: http://localhost:3000

## Project Structure

```
skill-swap/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration and auth
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── routers/        # API endpoints
│   ├── main.py             # FastAPI app
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   ├── package.json        # Node dependencies
│   └── tailwind.config.js  # Tailwind configuration
└── README.md              # Project documentation
```

## Features Implemented

### Backend (FastAPI)
✅ User Authentication (JWT)
✅ User Profile Management
✅ Skill Management
✅ User Search
✅ Swap Request System
✅ Feedback System
✅ Admin Panel
✅ Database Models (SQLite)
✅ API Documentation (Swagger)

### Frontend (React + TypeScript)
✅ Modern UI with Tailwind CSS
✅ Responsive Design
✅ Authentication Flow
✅ Protected Routes
✅ Navigation Sidebar
✅ Dashboard Overview
✅ Profile Management
✅ Search Interface (placeholder)
✅ Swap Management (placeholder)
✅ Admin Panel (placeholder)

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Users
- `PUT /users/me` - Update profile
- `GET /users/search` - Search users
- `POST /users/skills` - Add skill
- `GET /users/skills` - Get user skills

### Swaps
- `POST /swaps/request` - Create swap request
- `GET /swaps/my-requests` - Get sent requests
- `GET /swaps/received-requests` - Get received requests
- `PUT /swaps/{id}/status` - Update status

### Feedback
- `POST /feedback/` - Submit feedback
- `GET /feedback/my-feedback` - Get user feedback

### Admin
- `GET /admin/stats` - Platform statistics
- `GET /admin/users` - All users
- `PUT /admin/users/{id}/ban` - Ban user

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User profiles and authentication
- `skills` - Available skills
- `user_skills` - User-skill relationships
- `swap_requests` - Skill swap requests
- `feedback` - User feedback and ratings

## Development Notes

### Backend
- Uses SQLAlchemy for database ORM
- JWT authentication with bcrypt password hashing
- CORS enabled for frontend communication
- Automatic API documentation with Swagger

### Frontend
- Modern React with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management
- Axios for API communication

## Next Steps for Hackathon

1. **Add Sample Data**: Create some initial users and skills
2. **Enhance UI**: Add more interactive components
3. **Implement Search**: Complete the user search functionality
4. **Add Notifications**: Real-time notifications for swap requests
5. **File Upload**: Profile photo upload functionality
6. **Testing**: Add unit and integration tests

## Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Check that all dependencies are installed
- Verify the database file is created

### Frontend Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`
- Ensure all dependencies are installed

### Database Issues
- Delete `skill_swap.db` file to reset database
- Check SQLite is working: `sqlite3 skill_swap.db`

## Deployment

### Backend (Production)
```bash
# Install production dependencies
pip install gunicorn

# Run with gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend (Production)
```bash
# Build for production
npm run build

# Serve with nginx or similar
```

## Environment Variables

Create a `.env` file in the backend directory:
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./skill_swap.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is built for hackathon purposes. Feel free to use and modify as needed.

---

**Good luck with your hackathon! 🎉** 