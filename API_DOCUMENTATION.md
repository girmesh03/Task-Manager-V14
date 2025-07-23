# API Documentation - Task Manager SaaS Platform

## Base URL
```
http://localhost:5000/api
```

## Authentication
All authenticated endpoints require a JWT token sent as an HTTP-only cookie named `access_token`.

### Headers
```
Content-Type: application/json
Cookie: access_token=<jwt_token>
```

## Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message",
      "value": "invalid_value"
    }
  ]
}
```

## Success Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

---

## Authentication Endpoints

### Register Company
**POST** `/auth/register`

Register a new company and create the first SuperAdmin user.

**Request Body:**
```json
{
  "company": {
    "name": "Company Name",
    "email": "company@example.com",
    "phone": "0912345678",
    "address": "Company Address",
    "size": "Small",
    "industry": "Technology",
    "logo": "https://example.com/logo.png"
  },
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@company.com",
    "password": "password123",
    "position": "CEO"
  },
  "department": {
    "name": "Management",
    "description": "Executive management department"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company registered successfully",
  "data": {
    "company": { /* Company object */ },
    "user": { /* User object */ },
    "department": { /* Department object */ }
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* User object with company and department populated */ }
  }
}
```

### Logout
**POST** `/auth/logout`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Refresh Token
**POST** `/auth/refresh`

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

---

## Company Management

### Get My Company
**GET** `/companies/my-company`

**Access:** All roles

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "company_id",
    "name": "Company Name",
    "email": "company@example.com",
    "phone": "+251912345678",
    "address": "Company Address",
    "size": "Small",
    "industry": "Technology",
    "subscription": {
      "plan": "basic",
      "status": "active",
      "expiresAt": "2024-01-23T00:00:00.000Z"
    },
    "departments": [/* Department objects */],
    "superAdmins": [/* SuperAdmin user objects */],
    "isActive": true,
    "createdAt": "2023-01-23T00:00:00.000Z",
    "updatedAt": "2023-01-23T00:00:00.000Z"
  }
}
```

### Update Company
**PUT** `/companies/:id`

**Access:** SuperAdmin only

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "email": "updated@company.com",
  "phone": "0987654321",
  "address": "New Address",
  "logo": "https://example.com/new-logo.png"
}
```

### Get Company Statistics
**GET** `/companies/:id/stats`

**Access:** All roles (own company only)

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "Company Name",
      "subscription": { /* Subscription details */ },
      "isActive": true
    },
    "departments": {
      "active": 5
    },
    "users": {
      "active": 25,
      "total": 30,
      "byRole": {
        "SuperAdmin": 2,
        "Admin": 3,
        "Manager": 5,
        "User": 20
      }
    }
  }
}
```

---

## Department Management

### Get Departments
**GET** `/departments`

**Access:** SuperAdmin: all, Others: own department only

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term
- `sort` (string): Sort field (default: -createdAt)

**Response:**
```json
{
  "success": true,
  "data": {
    "docs": [/* Department objects */],
    "totalDocs": 10,
    "limit": 10,
    "page": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Create Department
**POST** `/departments`

**Access:** SuperAdmin only

**Request Body:**
```json
{
  "name": "Department Name",
  "description": "Department description",
  "managers": ["manager_user_id1", "manager_user_id2"]
}
```

### Get Department Members
**GET** `/departments/:id/members`

**Access:** SuperAdmin: any, Others: own department only

**Query Parameters:**
- `page`, `limit`, `search`, `sort`
- `role` (string): Filter by role
- `isActive` (boolean): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": {
    "department": {
      "_id": "dept_id",
      "name": "Department Name"
    },
    "members": {
      "docs": [/* User objects */],
      /* Pagination info */
    }
  }
}
```

---

## User Management

### Get Users
**GET** `/users`

**Access:** SuperAdmin: all company users, Admin/Manager: own department, User: self only

**Query Parameters:**
- `page`, `limit`, `search`, `sort`
- `role` (string): Filter by role
- `department` (string): Filter by department (SuperAdmin only)
- `isActive` (boolean): Filter by active status

### Create User
**POST** `/users`

**Access:** SuperAdmin only

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@company.com",
  "password": "password123",
  "role": "Manager",
  "position": "Department Head",
  "department": "department_id",
  "skills": ["Leadership", "Project Management"]
}
```

### Update User
**PUT** `/users/:id`

**Access:** SuperAdmin: any user, Others: self only

**Request Body:**
```json
{
  "firstName": "Updated Name",
  "position": "New Position",
  "skills": ["New Skill"],
  "isActive": true
}
```

### Update Password
**PUT** `/users/:id/password`

**Access:** User: self only, SuperAdmin: any user

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## Task Management

### Assigned Tasks

#### Get Assigned Tasks
**GET** `/assigned-tasks`

**Access:** SuperAdmin: all company tasks, Admin/Manager: own department, User: assigned to self

**Query Parameters:**
- `page`, `limit`, `search`, `sort`
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `department` (string): Filter by department

**Response:**
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "task_id",
        "title": "Task Title",
        "description": "Task description",
        "status": "In Progress",
        "priority": "High",
        "location": "Office Building",
        "dueDate": "2023-12-31T00:00:00.000Z",
        "assignedTo": [/* User objects */],
        "completedBy": [
          {
            "user": { /* User object */ },
            "completedAt": "2023-12-25T00:00:00.000Z"
          }
        ],
        "progress": 50,
        "createdBy": { /* User object */ },
        "department": { /* Department object */ },
        "company": "company_id",
        "createdAt": "2023-12-01T00:00:00.000Z"
      }
    ],
    /* Pagination info */
  }
}
```

#### Create Assigned Task
**POST** `/assigned-tasks`

**Access:** SuperAdmin: any department, Admin/Manager: own department only

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "location": "Office Building",
  "dueDate": "2023-12-31T00:00:00.000Z",
  "priority": "High",
  "department": "department_id",
  "assignedTo": ["user_id1", "user_id2"]
}
```

#### Mark Task Complete
**PUT** `/assigned-tasks/:id/complete`

**Access:** User: assigned tasks only, Admin/Manager: own department, SuperAdmin: any

#### Get My Assigned Tasks
**GET** `/assigned-tasks/my-tasks`

**Access:** All roles

**Query Parameters:**
- `page`, `limit`, `sort`
- `status`, `priority`

---

### Project Tasks

#### Get Project Tasks
**GET** `/project-tasks`

**Access:** SuperAdmin: all company tasks, Admin/Manager: own department, User: none

#### Create Project Task
**POST** `/project-tasks`

**Access:** SuperAdmin: any department, Admin/Manager: own department only

**Request Body:**
```json
{
  "title": "Client Project",
  "description": "Project description",
  "location": "Client Site",
  "dueDate": "2023-12-31T00:00:00.000Z",
  "priority": "High",
  "department": "department_id",
  "clientInfo": {
    "name": "Client Company",
    "phone": "0912345678",
    "address": "Client Address"
  }
}
```

#### Get Project Tasks by Client
**GET** `/project-tasks/by-client`

**Access:** SuperAdmin: company wide, Admin/Manager: own department

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "Client Company",
      "totalTasks": 10,
      "completedTasks": 7,
      "pendingTasks": 3,
      "lastTaskDate": "2023-12-25T00:00:00.000Z"
    }
  ]
}
```

---

### Routine Tasks

#### Get Routine Tasks
**GET** `/routine-tasks`

**Access:** SuperAdmin: all company tasks, Others: own department only

**Query Parameters:**
- `page`, `limit`, `search`, `sort`
- `date` (string): Filter by date (YYYY-MM-DD)
- `performedBy` (string): Filter by user

#### Create Routine Task
**POST** `/routine-tasks`

**Access:** All roles can create routine tasks in their own department

**Request Body:**
```json
{
  "department": "department_id",
  "date": "2023-12-25T00:00:00.000Z",
  "performedTasks": [
    {
      "description": "Daily cleanup",
      "isCompleted": true
    },
    {
      "description": "Equipment check",
      "isCompleted": false
    }
  ],
  "attachments": [
    {
      "url": "https://example.com/image.jpg",
      "type": "image"
    }
  ]
}
```

#### Update Routine Task Progress
**PUT** `/routine-tasks/:id/progress`

**Request Body:**
```json
{
  "taskIndex": 0,
  "isCompleted": true
}
```

---

## Task Activities

### Get Task Activities
**GET** `/task-activities`

**Access:** SuperAdmin: all company activities, Admin/Manager: own department, User: assigned tasks only

**Query Parameters:**
- `page`, `limit`, `search`, `sort`
- `taskId` (string): Filter by task
- `performedBy` (string): Filter by user

### Create Task Activity
**POST** `/task-activities`

**Access:** SuperAdmin: any task, Admin/Manager: own department, User: assigned tasks only

**Request Body:**
```json
{
  "task": "task_id",
  "description": "Activity description",
  "statusChange": {
    "to": "Completed"
  },
  "attachments": [
    {
      "url": "https://example.com/file.pdf",
      "type": "pdf"
    }
  ]
}
```

### Get Task Activities for Specific Task
**GET** `/task-activities/task/:taskId`

**Access:** Same as task access permissions

---

## Notifications

### Get My Notifications
**GET** `/notifications/my-notifications`

**Access:** All roles

**Query Parameters:**
- `page`, `limit`, `sort`
- `isRead` (boolean): Filter by read status
- `type` (string): Filter by notification type

**Response:**
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "notification_id",
        "message": "You have been assigned a new task: Task Title",
        "type": "TaskAssignment",
        "isRead": false,
        "task": { /* Task object */ },
        "department": { /* Department object */ },
        "linkedDocument": "task_id",
        "linkedDocumentType": "Task",
        "createdAt": "2023-12-25T00:00:00.000Z"
      }
    ],
    /* Pagination info */
  }
}
```

### Mark Notification as Read
**PUT** `/notifications/:id/read`

### Mark All Notifications as Read
**PUT** `/notifications/mark-all-read`

### Get Unread Notification Count
**GET** `/notifications/unread-count`

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### Delete Notification
**DELETE** `/notifications/:id`

### Get Notification Statistics
**GET** `/notifications/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 100,
      "unread": 15,
      "read": 85,
      "recent": 10
    },
    "byType": {
      "TaskAssignment": 30,
      "TaskCompletion": 25,
      "TaskUpdate": 20,
      "StatusChange": 15,
      "SystemAlert": 10
    }
  }
}
```

---

## HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- Window: 15 minutes
- Max requests per window: 100 requests per IP
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Pagination

All list endpoints support pagination with the following query parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `sort` (string): Sort field (prefix with `-` for descending)

Pagination response format:
```json
{
  "docs": [],
  "totalDocs": 100,
  "limit": 10,
  "page": 1,
  "totalPages": 10,
  "hasNextPage": true,
  "hasPrevPage": false,
  "nextPage": 2,
  "prevPage": null,
  "pagingCounter": 1
}
```
