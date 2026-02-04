# Admin Guide

## User Management

The User Management Dashboard allows Administrators to view, search, create, and export user data.

### Accessing the Dashboard
1. Log in with an account having the `ADMIN` role.
2. Click on your profile icon in the sidebar.
3. Select "Admin Panel" from the dropdown menu.

### Features

#### 1. User List
- Displays a table of all registered users.
- Shows Name, Email, Role, Join Date, and Status.
- **Sorting**: Click on column headers (Name, Email, Role, Joined) to sort ascending or descending.
- **Pagination**: Use "Previous" and "Next" buttons to navigate through pages.

#### 2. Search
- Use the search bar to filter users by Name or Email.
- Results update automatically after a short delay.

#### 3. Add User
1. Click the "Add User" button.
2. Fill in the required fields:
   - **Name**: User's display name.
   - **Email**: Must be unique.
   - **Password**: Minimum 6 characters.
   - **Role**: Select from Client, Manager, or Admin.
3. Click "Create User".

#### 4. Export Data
- Click "Export CSV" to download the full list of users as a `.csv` file.

### API Endpoints (For Developers)

- **GET /users**
  - Query Params: `page`, `limit`, `search`, `sortBy`, `sortOrder`
  - Requires: `ADMIN` role
- **POST /users**
  - Body: `{ email, password, name, role }`
  - Requires: `ADMIN` role
- **GET /users/export**
  - Returns: CSV file
  - Requires: `ADMIN` role

## Room Management

### Editing Rooms
Administrators and Managers can edit room details including name and description.

1. Navigate to the chat sidebar.
2. Click the edit icon (pencil) next to a room name.
3. Update the **Name** (max 100 chars) or **Description** (max 500 chars).
4. Click "Update" to save changes.

### Validation Rules
- **Name**: Required, max 100 characters, must be unique.
- **Description**: Optional, max 500 characters.

### API Endpoints (For Developers)
- **PATCH /rooms/:id**
  - Body: `{ name?: string, description?: string }`
  - Requires: `ADMIN` or `MANAGER` role
