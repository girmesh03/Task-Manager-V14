# Task Manager SaaS Platform

A comprehensive multi-tenant SaaS task management platform built with the MERN stack, designed for enterprise-level organizational workflow management.

## 🚀 Features

### Multi-Tenant Architecture
- **Company Workspaces**: Each company operates in its own isolated workspace
- **Role-Based Access Control**: Four roles with detailed permissions (SuperAdmin, Admin, Manager, User)
- **Department Organization**: Users and tasks organized by departments within companies
- **Subscription Management**: Built-in subscription handling for SaaS operations

### Task Management
- **AssignedTask**: Team tasks with user assignments and progress tracking
- **ProjectTask**: Client project management tasks (Admin/Manager only)
- **RoutineTask**: Daily routine task logging (all roles)
- **Task Activities**: Complete audit trail for all task-related activities

### Real-Time Features
- **Live Notifications**: Real-time system notifications for task activities
- **WebSocket Communication**: Instant updates using Socket.IO
- **Activity Tracking**: Complete audit trail of all user actions

### Security & Compliance
- **JWT Authentication**: Secure token-based authentication
- **Multi-Tenant Security**: Strict company boundaries and workspace isolation
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against abuse and DOS attacks

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: Socket.IO for WebSocket connections
- **Validation**: express-validator for input validation
- **Security**: helmet, cors, express-rate-limit, express-mongo-sanitize

### Frontend
- **Framework**: React 18 with Vite build tool
- **UI Library**: Material-UI (MUI) component library
- **State Management**: Redux Toolkit
- **Routing**: React Router with protected routes
- **Forms**: React Hook Form for form management
- **HTTP Client**: Axios for API communication
- **Notifications**: React Toastify
- **PDF Generation**: jsPDF for document generation

## 🔒 Authorization Matrix

### Roles & Permissions

| Resource | SuperAdmin | Admin | Manager | User |
|----------|------------|-------|---------|------|
| **Company** | Full Access | Read Only | Read Only | Read Only |
| **Department** | Full Access | Own Dept | Own Dept | Own Dept |
| **Users** | Full Access | Own Dept | Own Dept | Self Only |
| **AssignedTask** | Full Access | Own Dept | Own Dept | Assigned Only |
| **ProjectTask** | Full Access | Own Dept | Own Dept | No Access |
| **RoutineTask** | Full Access | Own Dept | Own Dept | Own Dept |
| **TaskActivity** | Full Access | Own Dept | Own Dept | Assigned Only |
| **Notifications** | Full Access | Own Only | Own Only | Own Only |

## 📁 Project Structure

```
task-manager-saas/
├── backend/
│   ├── config/          # Database and CORS configuration
│   ├── controllers/     # Route handlers and business logic
│   ├── middlewares/     # Authentication, authorization, validation
│   ├── models/          # MongoDB schemas and models
│   ├── routes/          # API route definitions
│   ├── errorHandler/    # Custom error handling
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app configuration
│   ├── server.js        # Server startup
│   └── socket.js        # Socket.IO configuration
├── client/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Redux store configuration
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Utility functions
│   │   └── App.js       # Main app component
│   └── public/          # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-manager-saas
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/task_manager_saas
   JWT_ACCESS_SECRET=your-super-secret-jwt-access-token
   JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-token
   JWT_ACCESS_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   ```

5. **Start MongoDB**
   ```bash
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # Or use MongoDB Atlas cloud database
   ```

6. **Start the development servers**
   
   Backend:
   ```bash
   cd backend
   npm run server
   ```
   
   Frontend:
   ```bash
   cd client
   npm run dev
   ```

### Production Deployment

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Start the backend in production**
   ```bash
   cd backend
   npm start
   ```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new company
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Company Management
- `GET /api/companies/my-company` - Get current company
- `PUT /api/companies/:id` - Update company (SuperAdmin only)
- `GET /api/companies/:id/stats` - Get company statistics

### Department Management
- `GET /api/departments` - Get departments
- `POST /api/departments` - Create department (SuperAdmin only)
- `PUT /api/departments/:id` - Update department (SuperAdmin only)
- `DELETE /api/departments/:id` - Delete department (SuperAdmin only)

### User Management
- `GET /api/users` - Get users (role-based filtering)
- `POST /api/users` - Create user (SuperAdmin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (SuperAdmin only)

### Task Management
- `GET /api/assigned-tasks` - Get assigned tasks
- `POST /api/assigned-tasks` - Create assigned task
- `PUT /api/assigned-tasks/:id/complete` - Mark task complete
- `GET /api/project-tasks` - Get project tasks (Admin/Manager only)
- `GET /api/routine-tasks` - Get routine tasks

### Notifications
- `GET /api/notifications/my-notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `GET /api/notifications/unread-count` - Get unread count

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |

#### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |
| `VITE_SOCKET_URL` | Socket.IO server URL | http://localhost:5000 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Material-UI for the excellent React components
- MongoDB for the flexible document database
- Socket.IO for real-time communication
- Express.js for the robust web framework

## 📞 Support

For support, email support@taskmanager-saas.com or create an issue in the repository.

---

Built with ❤️ for modern enterprise task management.
