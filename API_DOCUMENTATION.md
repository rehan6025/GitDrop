# Git-Drop API Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Authentication System](#authentication-system)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Frontend Integration Guide](#frontend-integration-guide)
8. [Configuration Requirements](#configuration-requirements)

---

## Project Overview

**Git-Drop** is a deployment platform that allows users to deploy their GitHub repositories as static websites or React applications. The system provides:

- GitHub OAuth authentication
- Repository and branch listing
- Deployment queue management
- Support for static sites and React applications
- Automatic project URL generation

The backend is built with **NestJS** (Node.js framework), uses **PostgreSQL** with **Prisma ORM**, and employs **BullMQ** for job queue management. The system runs deployments in isolated environments and serves them via nginx with subdomain routing.

---

## Architecture & Tech Stack

### Backend Stack
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: BullMQ (Redis-based)
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **External APIs**: GitHub OAuth API, GitHub REST API

### Key Features
- RESTful API design
- JWT-based authentication with cookie storage
- Background job processing for deployments
- CORS enabled with credentials support
- Cookie-based session management

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: Configure via `PORT` environment variable

---

## Authentication System

### Overview
The application uses GitHub OAuth 2.0 for authentication. The flow is:

1. User clicks "Login with GitHub"
2. Frontend redirects to `/auth/github`
3. Backend redirects to GitHub OAuth page
4. GitHub redirects back to `/auth/callback?code=...`
5. Backend exchanges code for access token
6. Backend creates/updates user and generates JWT
7. JWT is set as HTTP-only cookie
8. User is redirected to frontend

### Authentication Flow Details

**Step 1: Initiate Login**
- Frontend redirects user to: `GET /auth/github`
- No authentication required
- Backend redirects to GitHub OAuth page

**Step 2: OAuth Callback**
- GitHub redirects to: `GET /auth/callback?code={authorization_code}`
- Backend processes the callback
- Sets JWT cookie with 7-day expiration
- Redirects to frontend URL (configured via `FRONTEND_URL` env var, defaults to `http://localhost:5173`)

**Step 3: Authenticated Requests**
- All protected endpoints require JWT token
- Token is sent automatically via HTTP-only cookie
- Frontend doesn't need to manually handle token storage
- Token contains: `{ id, githubId, githubUsername }`

### Cookie Configuration
- **Name**: `jwt`
- **HttpOnly**: `true` (prevents JavaScript access)
- **SameSite**: `lax`
- **Secure**: `false` in development, should be `true` in production (HTTPS)
- **MaxAge**: 7 days (604800000 milliseconds)

### Protected Endpoints
All endpoints except `/`, `/auth/github`, and `/auth/callback` require authentication via `AuthGuard`.

---

## API Endpoints

### 1. Root Endpoint

#### `GET /`
**Description**: Health check endpoint  
**Authentication**: Not required  
**Response**: 
```json
"Hello World!"
```
**Status Code**: `200 OK`

**Usage**: Simple health check to verify the API is running.

---

### 2. Authentication Endpoints

#### `GET /auth/github`
**Description**: Initiates GitHub OAuth flow  
**Authentication**: Not required  
**Request**: No body or query parameters  
**Response**: HTTP 302 Redirect to GitHub OAuth page

**GitHub OAuth URL Format**:
```
https://github.com/login/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=user%20repo
```

**Frontend Implementation**:
```javascript
// Simply redirect user to this endpoint
window.location.href = 'http://localhost:3000/auth/github';
```

**Notes**:
- Requires `CLIENT_ID` and `REDIRECT_URI` environment variables
- Scope includes `user` and `repo` permissions
- User will be redirected to GitHub login page

---

#### `GET /auth/callback`
**Description**: GitHub OAuth callback handler  
**Authentication**: Not required  
**Query Parameters**:
- `code` (string, required): Authorization code from GitHub

**Request Example**:
```
GET /auth/callback?code=abc123def456
```

**Response**: HTTP 302 Redirect to frontend URL

**Process**:
1. Backend exchanges `code` for access token
2. Fetches user info from GitHub API
3. Creates or updates user in database
4. Generates JWT token
5. Sets JWT as HTTP-only cookie
6. Redirects to `FRONTEND_URL` (default: `http://localhost:5173`)

**Frontend Implementation**:
- This endpoint is called automatically by GitHub
- No frontend code needed, but frontend should handle the redirect
- After redirect, user is authenticated (cookie is set)

**Error Handling**:
- If code is invalid or expired, GitHub will show error
- Backend will handle token exchange failures

---

### 3. GitHub Integration Endpoints

#### `GET /github/repos`
**Description**: Fetches all repositories for the authenticated user  
**Authentication**: Required (JWT cookie)  
**Request**: No body or query parameters  
**Response**: Array of GitHub repository objects

**Response Example**:
```json
[
  {
    "id": 123456789,
    "node_id": "R_kgDO...",
    "name": "my-repo",
    "full_name": "username/my-repo",
    "private": false,
    "owner": {
      "login": "username",
      "id": 12345,
      "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
      ...
    },
    "html_url": "https://github.com/username/my-repo",
    "description": "Repository description",
    "fork": false,
    "url": "https://api.github.com/repos/username/my-repo",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z",
    "pushed_at": "2024-01-03T00:00:00Z",
    "default_branch": "main",
    ...
  }
]
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: No JWT token or invalid token
- `404 Not Found`: Could not fetch repositories (GitHub API error)

**Frontend Implementation**:
```javascript
// Fetch repositories
const response = await fetch('http://localhost:3000/github/repos', {
  method: 'GET',
  credentials: 'include', // Important: include cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

if (response.ok) {
  const repos = await response.json();
  // Display repos in UI
} else if (response.status === 401) {
  // Redirect to login
  window.location.href = '/auth/github';
}
```

**Notes**:
- Returns repositories from GitHub API directly
- Includes all standard GitHub repository fields
- Only returns repos accessible to authenticated user
- Requires GitHub access token stored in database

---

#### `GET /github/repos/:owner/:repo/branches`
**Description**: Fetches all branches for a specific repository  
**Authentication**: Required (JWT cookie)  
**Path Parameters**:
- `owner` (string, required): Repository owner username
- `repo` (string, required): Repository name

**Request Example**:
```
GET /github/repos/username/my-repo/branches
```

**Response**: Array of branch objects

**Response Example**:
```json
[
  {
    "name": "main",
    "sha": "abc123def456..."
  },
  {
    "name": "develop",
    "sha": "def456ghi789..."
  },
  {
    "name": "feature/new-feature",
    "sha": "ghi789jkl012..."
  }
]
```

**Response Fields**:
- `name` (string): Branch name
- `sha` (string): Latest commit SHA for the branch

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: No JWT token or invalid token
- `404 Not Found`: Repository not found or could not fetch branches

**Frontend Implementation**:
```javascript
// Fetch branches for a repository
const owner = 'username';
const repo = 'my-repo';
const response = await fetch(
  `http://localhost:3000/github/repos/${owner}/${repo}/branches`,
  {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

if (response.ok) {
  const branches = await response.json();
  // Display branches in dropdown/select
} else if (response.status === 401) {
  // Redirect to login
  window.location.href = '/auth/github';
}
```

**Notes**:
- Owner and repo names are case-sensitive
- Returns simplified branch data (name and SHA only)
- Requires user to have access to the repository
- Uses authenticated user's GitHub token

---

### 4. Deployment Endpoints

#### `POST /deployment`
**Description**: Creates a new deployment job  
**Authentication**: Required (JWT cookie)  
**Request Body**:
```json
{
  "name": "my-project",
  "repoUrl": "https://github.com/username/my-repo",
  "branch": "main",
  "type": "REACT",
  "commitHash": "abc123def456...",
  "buildCommand": "npm run build"
}
```

**Request Body Fields**:
- `name` (string, required): Project name (unique per user)
- `repoUrl` (string, required): Full GitHub repository URL
- `branch` (string, required): Branch name to deploy
- `type` (string, required): Project type - either `"STATIC"` or `"REACT"`
- `commitHash` (string, optional): Specific commit SHA to deploy
- `buildCommand` (string, optional): Custom build command (e.g., `"npm run build"`, `"yarn build"`)

**Response**:
```json
{
  "deploymentId": 123,
  "status": "QUEUED"
}
```

**Response Fields**:
- `deploymentId` (number): Unique deployment ID
- `status` (string): Initial deployment status (`"QUEUED"`)

**Status Codes**:
- `200 OK`: Deployment queued successfully
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: No JWT token or invalid token
- `500 Internal Server Error`: Failed to queue deployment

**Frontend Implementation**:
```javascript
// Create a new deployment
const deploymentData = {
  name: 'my-awesome-project',
  repoUrl: 'https://github.com/username/my-repo',
  branch: 'main',
  type: 'REACT',
  commitHash: 'abc123def456...', // Optional
  buildCommand: 'npm run build', // Optional
};

const response = await fetch('http://localhost:3000/deployment', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(deploymentData),
});

if (response.ok) {
  const result = await response.json();
  console.log('Deployment queued:', result.deploymentId);
  // Show success message, redirect to deployment status page
} else if (response.status === 401) {
  // Redirect to login
  window.location.href = '/auth/github';
} else {
  // Handle error
  const error = await response.json();
  console.error('Deployment failed:', error);
}
```

**Project Type Values**:
- `"STATIC"`: Static HTML/CSS/JS website
- `"REACT"`: React application (requires build step)

**Notes**:
- Project name must be unique per user
- If project with same name exists, it will be updated (upsert)
- Deployment is processed asynchronously via job queue
- Project URL is auto-generated from project name
- If deployment fails to queue, status is set to `"FAIL"`

**Deployment Status Flow**:
1. `QUEUED` - Initial status when added to queue
2. `IN_PROGRESS` - Deployment is being processed
3. `READY` - Deployment completed successfully
4. `FAIL` - Deployment failed

---

## Data Models

### User Model
```typescript
{
  id: number;              // Auto-increment primary key
  githubId: string;        // GitHub user ID (unique)
  username: string;        // GitHub username
  createdAt: Date;         // Account creation timestamp
}
```

### Project Model
```typescript
{
  id: number;              // Auto-increment primary key
  name: string;            // Project name (unique per user)
  user_id: number;         // Foreign key to User
  repoUrl: string;         // GitHub repository URL (unique)
  url: string;             // Deployment URL (unique, auto-generated)
  type: "STATIC" | "REACT"; // Project type
  status: string;          // Project status (default: "CREATED")
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Deployment Model
```typescript
{
  id: number;              // Auto-increment primary key
  status: DeploymentStatus; // Deployment status
  commitHash: string | null; // Git commit SHA (optional)
  project_id: number;      // Foreign key to Project
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### DeploymentStatus Enum
```typescript
enum DeploymentStatus {
  NOT_STARTED = "NOT_STARTED",
  QUEUED = "QUEUED",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
  FAIL = "FAIL"
}
```

### ProjectType Enum
```typescript
enum ProjectType {
  STATIC = "STATIC",
  REACT = "REACT"
}
```

### JWT Payload
```typescript
{
  id: number;              // User ID
  githubId: string;        // GitHub user ID
  githubUsername: string;  // GitHub username
}
```

---

## Error Handling

### Standard HTTP Status Codes

**2xx Success**:
- `200 OK`: Request successful

**4xx Client Errors**:
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Resource not found (repository, branch, etc.)

**5xx Server Errors**:
- `500 Internal Server Error`: Server-side error

### Error Response Format
Most errors return standard HTTP status codes. Some may include error messages in the response body:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Common Error Scenarios

**1. Unauthenticated Request**
- **Status**: `401 Unauthorized`
- **Cause**: Missing JWT cookie or invalid token
- **Frontend Action**: Redirect to `/auth/github`

**2. GitHub Account Not Linked**
- **Status**: `401 Unauthorized`
- **Message**: "GitHub account not linked"
- **Cause**: User exists but GitHub auth token is missing
- **Frontend Action**: Prompt user to re-authenticate

**3. Repository Not Found**
- **Status**: `404 Not Found`
- **Message**: "Could not fetch Github repositories" or "Could not fetch branches"
- **Cause**: Repository doesn't exist or user doesn't have access
- **Frontend Action**: Show error message, allow user to retry

**4. Deployment Queue Failure**
- **Status**: `500 Internal Server Error`
- **Cause**: Failed to add job to queue or database error
- **Frontend Action**: Show error message, allow user to retry

---

## Frontend Integration Guide

### 1. Setup and Configuration

**Base API URL**:
```javascript
const API_BASE_URL = 'http://localhost:3000';
// In production, use your production API URL
```

**Fetch Configuration**:
Always include `credentials: 'include'` to send cookies:
```javascript
const fetchOptions = {
  credentials: 'include', // Critical for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
};
```

### 2. Authentication Flow Implementation

**Login Button Handler**:
```javascript
const handleLogin = () => {
  // Simply redirect to auth endpoint
  window.location.href = `${API_BASE_URL}/auth/github`;
};
```

**Check Authentication Status**:
```javascript
const checkAuth = async () => {
  try {
    // Try to fetch a protected endpoint
    const response = await fetch(`${API_BASE_URL}/github/repos`, {
      credentials: 'include',
    });
    
    if (response.status === 401) {
      return false; // Not authenticated
    }
    return response.ok; // Authenticated
  } catch (error) {
    return false;
  }
};
```

**Logout Handler**:
```javascript
const handleLogout = () => {
  // Since cookie is HTTP-only, frontend can't delete it directly
  // Option 1: Call a logout endpoint (if implemented)
  // Option 2: Clear frontend state and redirect to login
  // Cookie will expire naturally or be cleared by browser
  window.location.href = '/login';
};
```

### 3. Repository Selection Flow

**Step 1: Fetch User Repositories**
```javascript
const fetchRepositories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/github/repos`, {
      credentials: 'include',
    });
    
    if (response.status === 401) {
      // Redirect to login
      window.location.href = `${API_BASE_URL}/auth/github`;
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    
    const repos = await response.json();
    return repos;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
};
```

**Step 2: Fetch Branches for Selected Repository**
```javascript
const fetchBranches = async (owner, repo) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/github/repos/${owner}/${repo}/branches`,
      {
        credentials: 'include',
      }
    );
    
    if (response.status === 401) {
      window.location.href = `${API_BASE_URL}/auth/github`;
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch branches');
    }
    
    const branches = await response.json();
    return branches;
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
};
```

**UI Flow Example**:
1. User clicks "Select Repository"
2. Show loading state
3. Fetch and display repositories
4. User selects a repository
5. Fetch and display branches for that repository
6. User selects branch (and optionally commit)
7. User fills in project name and type
8. Submit deployment

### 4. Deployment Creation Flow

**Create Deployment**:
```javascript
const createDeployment = async (deploymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deployment`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: deploymentData.name,
        repoUrl: deploymentData.repoUrl,
        branch: deploymentData.branch,
        type: deploymentData.type, // "STATIC" or "REACT"
        commitHash: deploymentData.commitHash, // Optional
        buildCommand: deploymentData.buildCommand, // Optional
      }),
    });
    
    if (response.status === 401) {
      window.location.href = `${API_BASE_URL}/auth/github`;
      return;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create deployment');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating deployment:', error);
    throw error;
  }
};
```

**Example Usage**:
```javascript
const handleDeploy = async () => {
  try {
    setLoading(true);
    
    const result = await createDeployment({
      name: 'my-project',
      repoUrl: selectedRepo.html_url,
      branch: selectedBranch.name,
      type: 'REACT',
      commitHash: selectedBranch.sha,
      buildCommand: 'npm run build',
    });
    
    // Show success message
    alert(`Deployment queued! ID: ${result.deploymentId}`);
    
    // Navigate to deployment status page
    navigate(`/deployments/${result.deploymentId}`);
  } catch (error) {
    alert(`Deployment failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### 5. Recommended UI Components

**1. Login Page**
- "Login with GitHub" button
- Redirects to `/auth/github`

**2. Dashboard**
- List of user's projects
- "New Deployment" button
- Project status indicators

**3. Repository Selector**
- Dropdown/searchable list of repositories
- Loading state while fetching
- Error handling for failed requests

**4. Branch Selector**
- Dropdown of branches for selected repository
- Shows commit SHA for each branch
- Optional: commit selector

**5. Deployment Form**
- Project name input
- Repository selector (from step 3)
- Branch selector (from step 4)
- Project type selector (STATIC/REACT)
- Build command input (optional)
- Submit button

**6. Deployment Status Page**
- Deployment ID
- Current status
- Project information
- Timestamps
- Error messages (if failed)

### 6. State Management Recommendations

**Authentication State**:
```javascript
// Check auth on app load
useEffect(() => {
  checkAuth().then(isAuthenticated => {
    setAuthenticated(isAuthenticated);
    if (!isAuthenticated) {
      navigate('/login');
    }
  });
}, []);
```

**Repository State**:
```javascript
const [repositories, setRepositories] = useState([]);
const [selectedRepo, setSelectedRepo] = useState(null);
const [branches, setBranches] = useState([]);
const [selectedBranch, setSelectedBranch] = useState(null);
```

**Deployment State**:
```javascript
const [deployments, setDeployments] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### 7. Error Handling Best Practices

**Global Error Handler**:
```javascript
const handleApiError = (error, response) => {
  if (response?.status === 401) {
    // Unauthorized - redirect to login
    window.location.href = `${API_BASE_URL}/auth/github`;
    return;
  }
  
  if (response?.status === 404) {
    // Not found - show user-friendly message
    return 'Resource not found. Please check your selection.';
  }
  
  if (response?.status >= 500) {
    // Server error - show generic error
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An error occurred';
};
```

### 8. CORS and Cookie Handling

**Important Notes**:
- Backend has CORS enabled with `credentials: true`
- Frontend must use `credentials: 'include'` in all fetch requests
- Cookies are HTTP-only, so JavaScript cannot access them directly
- Cookies are automatically sent with requests to the same origin
- For cross-origin requests, ensure proper CORS configuration

**Development Setup**:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173` (or your dev server port)
- Ensure both are running and CORS is properly configured

---

## Configuration Requirements

### Backend Environment Variables

The backend requires the following environment variables (see `confSample.txt` for reference):

**Required Variables**:
- `CLIENT_ID`: GitHub OAuth App Client ID
- `CLIENT_SECRET`: GitHub OAuth App Client Secret
- `REDIRECT_URI`: OAuth callback URL (e.g., `http://localhost:3000/auth/callback`)
- `JWT_SECRET`: Secret key for signing JWT tokens
- `FRONTEND_URL`: Frontend URL for OAuth redirect (e.g., `http://localhost:5173`)
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)

**Optional Variables**:
- `REDIS_HOST`: Redis host for BullMQ (default: localhost)
- `REDIS_PORT`: Redis port for BullMQ (default: 6379)

### GitHub OAuth App Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/auth/callback`
4. Copy Client ID and Client Secret
5. Add to backend `.env` file

### Database Setup

1. Install PostgreSQL
2. Create a database
3. Set `DATABASE_URL` in `.env`
4. Run Prisma migrations: `npx prisma migrate dev`
5. Generate Prisma client: `npx prisma generate`

### Redis Setup (for Job Queue)

1. Install Redis
2. Start Redis server
3. Backend will connect to `localhost:6379` by default
4. Configure via environment variables if needed

---

## Additional Notes

### Project URL Generation
- Project URLs are auto-generated from project name
- Format: `{project-name}` (used as subdomain)
- Example: Project named "my-app" gets URL "my-app"
- Full URL depends on nginx configuration (e.g., `my-app.localhost`)

### Deployment Processing
- Deployments are processed asynchronously via BullMQ
- Jobs are retried up to 3 times on failure
- Status updates happen in the background
- Frontend should poll or use WebSocket (if implemented) for status updates

### Security Considerations
- JWT tokens are stored in HTTP-only cookies (XSS protection)
- Cookies use `SameSite: lax` (CSRF protection)
- In production, set `secure: true` for HTTPS
- GitHub tokens are stored securely in database
- All protected endpoints require valid JWT

### Rate Limiting
- Currently no rate limiting implemented
- Consider adding rate limiting for production
- GitHub API has its own rate limits

### Future Enhancements (Not Currently Implemented)
- Deployment status polling endpoint
- Project listing endpoint
- Deployment history endpoint
- WebSocket for real-time status updates
- Log streaming endpoint
- Project deletion endpoint
- Deployment cancellation endpoint

---

## Summary

This API provides a complete deployment platform with:
- **5 main endpoints**: Root, 2 auth endpoints, 2 GitHub endpoints, 1 deployment endpoint
- **Cookie-based authentication**: Secure, HTTP-only JWT storage
- **GitHub integration**: Repository and branch listing
- **Async deployments**: Queue-based deployment processing
- **Two project types**: Static sites and React applications

The frontend should implement:
1. Login flow with GitHub OAuth
2. Repository and branch selection
3. Deployment creation form
4. Status monitoring (via polling or WebSocket if available)
5. Error handling and user feedback

All requests to protected endpoints must include `credentials: 'include'` to send the authentication cookie automatically.

