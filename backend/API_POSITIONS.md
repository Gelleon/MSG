# Positions Management Module

This module provides functionality for managing user positions (job titles) with bilingual support (Russian and Chinese).

## Data Model

**Position**
- `id`: UUID
- `nameRu`: String (Russian name)
- `nameZh`: String (Chinese name)
- `users`: Relation to Users

**User**
- `positionId`: Foreign key to Position

## API Endpoints

Base URL: `/positions`
Authentication: Required (JWT)

### 1. Create Position
- **Method**: `POST /positions`
- **Role**: `ADMIN`
- **Body**:
  ```json
  {
    "nameRu": "Менеджер",
    "nameZh": "Manager"
  }
  ```
- **Response**: Created Position object

### 2. Get All Positions
- **Method**: `GET /positions`
- **Role**: Authenticated User
- **Response**: Array of Position objects (including assigned users count/details)

### 3. Get One Position
- **Method**: `GET /positions/:id`
- **Role**: Authenticated User
- **Response**: Position object

### 4. Update Position
- **Method**: `PATCH /positions/:id`
- **Role**: `ADMIN`
- **Body**: Partial Position object
- **Response**: Updated Position object

### 5. Delete Position
- **Method**: `DELETE /positions/:id`
- **Role**: `ADMIN`
- **Response**: Success message

### 6. Assign Position to Users
- **Method**: `POST /positions/:id/assign`
- **Role**: `ADMIN`
- **Body**:
  ```json
  {
    "userIds": ["user-uuid-1", "user-uuid-2"]
  }
  ```
- **Response**: Batch update result

### 7. Unassign Position from Users
- **Method**: `POST /positions/unassign`
- **Role**: `ADMIN`
- **Body**:
  ```json
  {
    "userIds": ["user-uuid-1", "user-uuid-2"]
  }
  ```
- **Response**: Batch update result

## Frontend Integration

The frontend management interface is located at `/admin/positions`.
It allows:
- Viewing all positions
- Creating/Editing/Deleting positions
- Assigning users to positions (with search)
