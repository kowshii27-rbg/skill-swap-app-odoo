# Skill Swap Platform 🚀

A modern full-stack platform for skill exchange between users. Built with React, FastAPI, and Tailwind CSS.

## ✨ Features

### 🔐 Authentication & User Management
- **Secure JWT-based authentication**
- **User registration and login**
- **Profile management with photo upload**
- **Skills management (offered/wanted)**
- **Location and availability settings**

### 🔍 Search & Discovery
- **Advanced user search with filters**
- **Skill-based matching**
- **Location and availability filtering**
- **Pagination and responsive design**

### 💬 Swap Request System
- **Send detailed swap requests**
- **Custom messages and skill selection**
- **Modal-based request creation**
- **Real-time status tracking**

### 📋 Swap Management
- **Sent Requests Tab**: View and cancel your sent requests
- **Received Requests Tab**: Accept/reject incoming requests
- **Status Tracking**: Pending, Accepted, Rejected, Cancelled, Completed
- **Detailed View**: Modal with full request details
- **Real-time Updates**: Automatic refresh after actions

### 🎨 Modern UI/UX
- **Responsive design with Tailwind CSS**
- **Toast notifications for feedback**
- **Loading states and error handling**
- **Clean, professional interface**

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python 3.11+)
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT tokens
- **UI Components**: Lucide React Icons
- **State Management**: React Context API
- **HTTP Client**: Axios

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
skill-swap/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   ├── models/           # Database models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── core/             # Auth and config
│   │   └── database.py       # Database setup
│   ├── requirements.txt      # Python dependencies
│   └── main.py              # FastAPI app
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   ├── package.json         # Node dependencies
│   └── tailwind.config.js   # Tailwind config
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### User Management
- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update user profile
- `GET /users/search` - Search users by skills
- `GET /users/available-skills` - Get all available skills
- `POST /users/skills` - Add skill to user
- `DELETE /users/skills/{id}` - Remove skill from user

### Swap Requests
- `POST /swaps/request` - Create swap request
- `GET /swaps/my-requests` - Get user's sent requests
- `GET /swaps/received-requests` - Get user's received requests
- `PUT /swaps/{id}/status` - Update swap status
- `DELETE /swaps/{id}` - Cancel swap request
- `GET /swaps/{id}` - Get specific swap request

### Admin (if admin role)
- `GET /admin/stats` - Platform statistics
- `GET /admin/users` - All users
- `PUT /admin/users/{id}/ban` - Ban user
- `GET /admin/swaps` - All swap requests

## 🎯 User Flow

1. **Register/Login** → Create account or sign in
2. **Complete Profile** → Add skills, location, availability
3. **Search Users** → Find potential skill partners
4. **Send Swap Request** → Propose skill exchange
5. **Manage Requests** → Accept/reject incoming requests
6. **Track Status** → Monitor swap request progress

## 🔧 Development

### Backend Development
```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests (if available)
pytest
```

### Frontend Development
```bash
cd frontend
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Update database URL in `backend/app/core/config.py`
3. Set environment variables for JWT secrets
4. Deploy to your preferred platform (Heroku, Railway, etc.)

### Frontend Deployment
1. Update API URL in `frontend/src/services/api.ts`
2. Build the project: `npm run build`
3. Deploy the `build` folder to your hosting platform

## 📝 Environment Variables

### Backend
```env
DATABASE_URL=sqlite:///./skill_swap.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:8000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is built for educational purposes and hackathon submission.

---

**Built with ❤️ for skill sharing and community building** 