# REST API Plan

This document outlines the REST API for the Janus AI application, based on the provided database schema, product requirements, and technical stack.

## 1. Resources

The API is designed around the following primary resources:

-   **Users**: Represents user accounts and profiles. Managed by Supabase Auth, but with a profile endpoint.
-   **Transactions**: Represents all financial operations (buy, sell, dividend, etc.). Corresponds to the `transactions` table.
-   **Strategies**: Represents the user's investment strategy. Corresponds to the `investment_strategies` table.
-   **Analyses**: Represents the AI-generated portfolio analyses. Corresponds to the `ai_analyses` and `ai_recommendations` tables.
-   **Portfolio**: A virtual resource for aggregated portfolio data, derived from transactions.
-   **Dashboard**: A virtual resource providing a consolidated view of key metrics for the main dashboard.

## 2. Endpoints

All endpoints are prefixed with `/api/v1`. All authenticated routes require a `Bearer <JWT>` token in the `Authorization` header.

---

### 2.1. Authentication

-   **Resource**: `Auth`
-   **Description**: Handles user registration and login.

#### `POST /auth/register`

-   **Description**: Registers a new user via the backend, which proxies the request to Supabase Auth.
-   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123"
    }
    ```
-   **Success Response (201)**: The server sets a `refreshToken` in an `httpOnly` cookie and returns the `accessToken`.
    ```json
    {
      "accessToken": "jwt.access.token",
      "user": {
        "id": "uuid-string",
        "email": "user@example.com"
      }
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: Invalid email format or weak password.
    -   `409 Conflict`: A user with this email already exists.
-   **Validation**:
    -   The `email` must be a valid email format.
    -   The `password` must meet strength requirements (e.g., minimum length, character types).

#### `POST /auth/login`

-   **Description**: Authenticates a user via the backend and returns tokens.
-   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123"
    }
    ```
-   **Success Response (200)**: The server sets a `refreshToken` in an `httpOnly` cookie and returns the `accessToken`.
    ```json
    {
      "accessToken": "jwt.access.token",
      "user": {
        "id": "uuid-string",
        "email": "user@example.com"
      }
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: Missing email or password.
    -   `401 Unauthorized`: Invalid credentials.
-   **Validation**:
    -   The `email` and `password` fields are required.

#### `POST /auth/refresh`

-   **Description**: Refreshes the `accessToken` using the `refreshToken` stored in the cookie.
-   **Request Body**: (empty)
-   **Success Response (200)**: The server sets a new `refreshToken` in the cookie and returns a new `accessToken`.
    ```json
    {
      "accessToken": "new.jwt.access.token"
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing refresh token cookie.

#### `POST /auth/logout`

-   **Description**: Logs the user out by invalidating tokens and clearing the cookie.
-   **Request Body**: (empty)
-   **Success Response (204)**: No content. The `refreshToken` cookie is cleared.
-   **Error Responses**:
    -   `401 Unauthorized`: User is not logged in.

---

### 2.2. Transactions

-   **Resource**: `Transactions`
-   **Authentication**: Required for all endpoints.

#### `GET /transactions`

-   **Description**: Retrieves a paginated list of the user's transactions.
-   **Query Parameters**:
    -   `page` (number, default: 1): The page number for pagination.
    -   `limit` (number, default: 20): The number of items per page.
    -   `sortBy` (string, default: 'transaction_date'): Field to sort by.
    -   `order` (string, default: 'desc'): Sort order ('asc' or 'desc').
    -   `type` (string): Filter by transaction type (e.g., 'BUY', 'SELL').
    -   `ticker` (string): Filter by a specific ticker symbol.
-   **Success Response (200)**:
    ```json
    {
      "data": [
        {
          "id": "uuid-string",
          "accountType": "MAIN",
          "transactionType": "BUY",
          "ticker": "AAPL",
          "quantity": 10,
          "price": 150.00,
          "totalAmount": 1500.00,
          "commission": 1.99,
          "transactionDate": "2025-10-19T10:00:00Z"
        }
      ],
      "pagination": {
        "totalItems": 100,
        "totalPages": 5,
        "currentPage": 1,
        "limit": 20
      }
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing token.
-   **Validation**:
    -   Query parameters (`page`, `limit`, `sortBy`, `order`) will be validated for correct data types and values.
    -   The `ticker` query parameter, if provided, will be validated to be a string of 1-5 uppercase letters (e.g., `AAPL`).

#### `POST /transactions`

-   **Description**: Manually adds a new transaction.
-   **Request Body**:
    ```json
    {
      "accountTypeId": 1,
      "transactionTypeId": 1,
      "ticker": "GOOGL",
      "quantity": 5,
      "price": 2800.00,
      "totalAmount": 14000.00,
      "commission": 3.99,
      "transactionDate": "2025-10-20T12:00:00Z",
      "notes": "Manual entry"
    }
    ```
-   **Success Response (201)**: Returns the newly created transaction object.
-   **Error Responses**:
    -   `400 Bad Request`: Validation error (e.g., future date, negative price).
    -   `401 Unauthorized`: Invalid or missing token.
-   **Validation**:
    -   The request body will be validated to ensure `price > 0`, `quantity > 0`, and `transactionDate` is not in the future.
    -   The `ticker` must be a string of 1-5 uppercase letters with no spaces or special characters (e.g., `GOOGL`, `CDR`), matching a regex like `^[A-Z]{1,5}$`.

#### `POST /transactions/import-xtb`

-   **Description**: Imports transactions from an XTB-generated Excel file. The request must be `multipart/form-data`.
-   **Request Body**: A file upload with the key `file`.
-   **Success Response (201)**:
    ```json
    {
      "message": "File imported successfully.",
      "importedCount": 50,
      "importBatchId": "uuid-string"
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: No file provided, or file is not a valid Excel file.
    -   `401 Unauthorized`: Invalid or missing token.
    -   `422 Unprocessable Entity`: File format is incorrect or data parsing failed.
-   **Validation**:
    -   The request must be `multipart/form-data`.
    -   The `file` field must be present and must be a valid Excel file (`.xlsx`).

#### `GET /transactions/:id`

-   **Description**: Retrieves a single transaction by its ID.
-   **Success Response (200)**: Returns the transaction object.
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing token.
    -   `404 Not Found`: Transaction not found or does not belong to the user.

#### `PUT /transactions/:id`

-   **Description**: Updates an existing transaction.
-   **Request Body**: Same as `POST /transactions`, but fields are optional.
-   **Success Response (200)**: Returns the updated transaction object.
-   **Error Responses**:
    -   `400 Bad Request`: Validation error.
    -   `401 Unauthorized`: Invalid or missing token.
    -   `404 Not Found`: Transaction not found or does not belong to the user.
-   **Validation**:
    -   The request body fields will be validated similar to the `POST /transactions` endpoint.

#### `DELETE /transactions/:id`

-   **Description**: Deletes a transaction.
-   **Success Response (204)**: No content.
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing token.
    -   `404 Not Found`: Transaction not found or does not belong to the user.

---

### 2.3. Investment Strategy

-   **Resource**: `Strategy`
-   **Authentication**: Required.

#### `GET /strategy`

-   **Description**: Retrieves the user's investment strategy.
-   **Success Response (200)**:
    ```json
    {
      "id": "uuid-string",
      "timeHorizon": "LONG",
      "riskLevel": "MEDIUM",
      "investmentGoals": "Long-term growth and dividend income.",
      "updatedAt": "2025-10-19T11:00:00Z"
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing token.
    -   `404 Not Found`: The user has not defined a strategy yet.

#### `POST /strategy`

-   **Description**: Creates an investment strategy for the user. Fails if a strategy already exists.
-   **Request Body**:
    ```json
    {
      "timeHorizon": "LONG",
      "riskLevel": "MEDIUM",
      "investmentGoals": "Long-term growth and dividend income."
    }
    ```
-   **Success Response (201)**: Returns the newly created strategy object.
-   **Error Responses**:
    -   `400 Bad Request`: Validation error.
    -   `401 Unauthorized`: Invalid or missing token.
    -   `409 Conflict`: A strategy for this user already exists. Use `PUT` to update.
-   **Validation**:
    -   `timeHorizon` must be one of the allowed enum values (e.g., 'SHORT', 'MEDIUM', 'LONG').
    -   `riskLevel` must be one of the allowed enum values (e.g., 'LOW', 'MEDIUM', 'HIGH').

#### `PUT /strategy`

-   **Description**: Updates the user's existing investment strategy.
-   **Request Body**: Same as `POST /strategy`.
-   **Success Response (200)**: Returns the updated strategy object.
-   **Error Responses**:
    -   `400 Bad Request`: Validation error.
    -   `401 Unauthorized`: Invalid or missing token.
    -   `404 Not Found`: No strategy found to update.
-   **Validation**:
    -   The request body fields will be validated similar to the `POST /strategy` endpoint.

---

### 2.4. AI Analysis

-   **Resource**: `Analyses`
-   **Authentication**: Required.

#### `POST /analyses`

-   **Description**: Triggers a new AI analysis of the user's portfolio. This endpoint is rate-limited.
-   **Success Response (202 Accepted)**:
    ```json
    {
      "message": "Portfolio analysis has been initiated. The result will be available shortly.",
      "analysisId": "uuid-string"
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing token.
    -   `402 Payment Required`: User has no strategy defined (required for analysis).
    -   `429 Too Many Requests`: User has exceeded their daily analysis limit.
-   **Validation**:
    -   The endpoint will check if the user has an active investment strategy before proceeding.
    -   The user's rate limit for analyses will be checked.

#### `GET /analyses`

-   **Description**: Retrieves a paginated list of the user's past AI analyses.
-   **Query Parameters**:
    -   `page` (number, default: 1)
    -   `limit` (number, default: 10)
-   **Success Response (200)**:
    ```json
    {
      "data": [
        {
          "id": "uuid-string",
          "analysisDate": "2025-10-19T14:00:00Z",
          "portfolioValue": 125000.50,
          "aiModel": "claude-haiku-3"
        }
      ],
      "pagination": { ... }
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing token.

#### `GET /analyses/:id`

-   **Description**: Retrieves the full details of a specific AI analysis, including recommendations.
-   **Success Response (200)**:
    ```json
    {
      "id": "uuid-string",
      "analysisDate": "2025-10-19T14:00:00Z",
      "portfolioValue": 125000.50,
      "aiModel": "claude-haiku-3",
      "analysisSummary": "Your portfolio is well-diversified but slightly over-exposed to the tech sector...",
      "recommendations": [
        {
          "id": "uuid-string",
          "ticker": "AAPL",
          "action": "REDUCE",
          "reasoning": "The position has grown to be too large a percentage of your portfolio.",
          "confidence": "HIGH"
        },
        {
          "id": "uuid-string",
          "ticker": "XOM",
          "action": "BUY",
          "reasoning": "Increase exposure to the energy sector for better diversification.",
          "confidence": "MEDIUM"
        }
      ]
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing token.
    -   `404 Not Found`: Analysis not found or does not belong to the user.

---

### 2.5. Dashboard

-   **Resource**: `Dashboard`
-   **Authentication**: Required.

#### `GET /dashboard`

-   **Description**: Retrieves all necessary data for the main dashboard view in a single call.
-   **Success Response (200)**:
    ```json
    {
      "summary": {
        "totalValue": 125000.50,
        "currency": "PLN",
        "change": {
          "value": 1200.75,
          "percentage": 0.97
        }
      },
      "history": [
        { "date": "2025-09-01", "value": 118000.00 },
        { "date": "2025-09-02", "value": 119500.00 },
        // ... more data points
        { "date": "2025-10-19", "value": 125000.50 }
      ],
      "diversification": [
        { "ticker": "AAPL", "value": 25000.00, "percentage": 20.0 },
        { "ticker": "GOOGL", "value": 20000.00, "percentage": 16.0 },
        { "ticker": "MSFT", "value": 15000.00, "percentage": 12.0 },
        { "name": "Other", "value": 65000.50, "percentage": 52.0 }
      ]
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid or missing token.

## 3. Authentication and Authorization

-   **Mechanism**: Authentication will be handled by a **backend-for-frontend (BFF)** pattern, where the Express.js server acts as a proxy to Supabase Auth. The frontend will **only** communicate with the Express server for authentication.

-   **Authentication Flow**:
    1.  **Frontend to Backend**: The user submits their credentials (email/password) to endpoints on the Express server (e.g., `POST /api/v1/auth/login`).
    2.  **Backend to Supabase**: The Express server receives the credentials and uses the `supabase-js` library to call the appropriate Supabase Auth method (e.g., `supabase.auth.signInWithPassword(...)`).
    3.  **Supabase to Backend**: Supabase Auth validates the credentials and returns the full session object (including `accessToken` and `refreshToken`) to the Express server.
    4.  **Backend to Frontend**:
        -   The Express server sends the short-lived `accessToken` to the frontend in the JSON response body.
        -   Crucially, the long-lived `refreshToken` is set in a secure, `httpOnly` cookie, making it inaccessible to client-side JavaScript.
    5.  **Subsequent Requests**: The frontend includes the `accessToken` in the `Authorization: Bearer <token>` header for all future requests to protected API endpoints.

-   **Token Refresh Flow**:
    1.  When the `accessToken` expires, the frontend receives a `401 Unauthorized` error.
    2.  The frontend then makes a request to a new endpoint, `POST /api/v1/auth/refresh`, without any body.
    3.  The backend receives this request, extracts the `refreshToken` from the `httpOnly` cookie, and uses it to request a new session from Supabase Auth.
    4.  If successful, the backend sets a new `refreshToken` in the cookie and returns a new `accessToken` in the response body. The frontend can then retry the original failed request.

-   **Authorization**:
    -   **Token Verification**: A middleware on the Express server will validate the `accessToken` on every protected request by calling `supabase.auth.getUser(token)`.
    -   **Data Access**: Authorization logic remains the same: user identity from the validated token is used to scope database queries, and Supabase RLS provides a second layer of security.

## 4. Business Logic