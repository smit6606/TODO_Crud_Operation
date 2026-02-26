module.exports.MSG = {
  /* ==========================
     AUTHENTICATION
  ========================== */
  AUTH: {
    LOGIN_SUCCESS: "Login successful.",
    LOGIN_FAILED: "Invalid credentials.",
    REGISTER_SUCCESS: "Account created successfully.",
    LOGOUT_SUCCESS: "Logged out successfully.",
    TOKEN_GENERATED: "Access token generated successfully.",
    TOKEN_REFRESHED: "Token refreshed successfully.",
  },

  /* ==========================
     AUTHORIZATION / ACCESS
  ========================== */
  ACCESS: {
    UNAUTHORIZED: "Authentication required. Please login.",
    FORBIDDEN: "You do not have permission to perform this action.",
    TOKEN_MISSING: "Authentication token is missing.",
    TOKEN_INVALID: "Invalid or expired authentication token.",
    TOKEN_DELETED: "Token is no longer valid. User does not exist.",
    ACCESS_DENIED: "Access denied.",
    UNAUTHORIZED_UPDATE: "You are not authorized to update another user's profile.",
    UNAUTHORIZED_DELETE: "You are not authorized to delete another user's profile.",
    UNAUTHORIZED_TODO_UPDATE: "You are not authorized to update another user's task.",
    UNAUTHORIZED_TODO_DELETE: "You are not authorized to delete another user's task.",
  },

  /* ==========================
     USER MANAGEMENT (CRUD)
  ========================== */
  USER: {
    CREATED: "User registered successfully.",
    UPDATED: "User updated successfully.",
    DELETED: "User deleted successfully.",
    FETCHED: "User details retrieved successfully.",
    FETCHED_ALL: "Users retrieved successfully.",
    PROFILE_FETCHED: "Profile retrieved successfully.",
    PROFILE_UPDATED: "Profile updated successfully.",
    PROFILE_DELETED: "Profile deleted successfully.",
  },

  USER_ERROR: {
    NOT_FOUND: "User not found.",
    ALREADY_EXISTS: "User already exists.",
    EMAIL_EXISTS: "User with same email already exists.",
    USERNAME_EXISTS: "User with same username already exists.",
    PHONE_EXISTS: "User with same mobile number already exists.",
    INVALID_CREDENTIALS: "Invalid user credentials.",
    PASSWORD_MISMATCH: "Password does not match.",
    VALIDATION_FAILED: "User validation failed.",
    RESTRICTED_FIELDS: "You cannot update restricted fields like id or is_active.",
    INCOMPLETE_TASKS: "You cannot delete your account until all your tasks are completed.",
  },

  /* ==========================
     TODO MANAGEMENT (CRUD)
  ========================== */
  TODO: {
    CREATED: "Task created successfully.",
    UPDATED: "Task updated successfully.",
    DELETED: "Task deleted successfully.",
    FETCHED: "Task retrieved successfully.",
    FETCHED_ALL: "Tasks retrieved successfully.",
    COMPLETED: "Task marked as completed.",
    REOPENED: "Task reopened successfully.",
  },

  TODO_ERROR: {
    NOT_FOUND: "Task not found.",
    ALREADY_EXISTS: "Task already exists.",
    INVALID_STATUS: "Invalid task status provided.",
    INVALID_PRIORITY: "Invalid task priority provided.",
    VALIDATION_FAILED: "Task validation failed.",
  },

  /* ==========================
     VALIDATION & REQUEST
  ========================== */
  REQUEST: {
    BAD_REQUEST: "Invalid request data.",
    MISSING_FIELDS: "Required fields are missing.",
    INVALID_PARAMS: "Invalid request parameters.",
    INVALID_BODY: "Invalid request payload.",
  },

  /* ==========================
     DATABASE / SERVER
  ========================== */
  SERVER: {
    INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
    DATABASE_ERROR: "Database operation failed.",
    SERVICE_UNAVAILABLE: "Service temporarily unavailable.",
    ACTION_SUCCESS: "Operation completed successfully.",
    ACTION_FAILED: "Operation failed.",
  },
};
