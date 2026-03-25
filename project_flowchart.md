# LifeLink Project Flowchart

This flowchart outlines the architecture and core workflows of the LifeLink platform.

## System Architecture

```mermaid
graph TD
    subgraph Frontend [React Frontend]
        UI[User Interface / Views]
        Router[React Router]
        API_S[API Services / Axios]
        Store[State Management / Local Storage]
    end

    subgraph Backend [Node.js Express Backend]
        Auth_M[Auth Middleware / JWT]
        Routes[API Routes]
        Controllers[Express Controllers / Logic]
        Mailer[Nodemailer / SMTP]
    end

    subgraph Database [PostgreSQL]
        Users_T[(Users Table)]
        Req_T[(Donation Requests)]
        Don_T[(Donations)]
        Chat_T[(Messages)]
        Alert_T[(Alerts)]
    end

    UI --> Router
    Router --> UI
    UI --> API_S
    API_S --> Auth_M
    Auth_M --> Routes
    Routes --> Controllers
    Controllers --> Database
    Controllers --> Mailer
    Mailer --> User_Email[User Email Inbox]
```

## User Registration & Roles

```mermaid
graph LR
    Start([User Registration]) --> Role{Select Role}
    Role -- Donor/Patient --> D_P[User Table: role='user'/'patient']
    Role -- Hospital --> H[User Table: role='hospital']
    Role -- Admin --> A[User Table: role='admin' - Pre-created]

    D_P --> Auth_Flow[Registration/Login JWT]
    H --> Auth_Flow
    A --> Auth_Flow
```

## Core LifeLink Flow: Requesting & Finding Help

```mermaid
sequenceDiagram
    participant User as Donor/Patient
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant Admin as Admin

    User->>FE: Fills "Request Help" Form
    FE->>BE: POST /api/requests
    BE->>DB: INSERT INTO donation_requests
    DB-->>BE: Request Created
    BE->>DB: INSERT INTO alerts (Notify nearby)
    BE-->>FE: Success
    FE-->>User: Request Posted & Alerts Sent

    User->>FE: Navigates to "Find Donors"
    FE->>BE: GET /api/donors/locations
    BE->>DB: SELECT * FROM users WHERE role='user'
    DB-->>BE: Donor List
    BE-->>FE: Donor Markers
    FE-->>User: Renders Map with Donors
```

## Admin Oversight Flow

```mermaid
graph TD
    Admin_L([Admin Login]) --> Dashboard[Admin Dashboard]
    Dashboard --> Users_M[User Management]
    Dashboard --> Reports[Donation Reports]
    Dashboard --> Alerts_M[Global Alerts/Announcements]

    Users_M --> Review{Verify User KYC}
    Review -- Approved --> DB_Update[(Update user status)]
    Review -- Rejected --> Notify[Notify User]
```
