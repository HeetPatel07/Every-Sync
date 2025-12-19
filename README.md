# EventSync

EventSync is a lightweight, scalable log reporting and synchronization service designed to mock real-world event monitoring. It centralizes log ingestion and provides a dual-consumption model: **Incremental Polling** for dashboard synchronization and **Webhook Broadcasting** for real-time notifications.


## 💡 Lightweight & Educational

This project is a **lightweight, educational-grade implementation** of a log distribution system. It is built on the idea that if a user wants to be notified about a specific type of error or log, the system should bundle those events and broadcast them.

The implementation uses a hybrid "Push and Pull" approach:
*   **Push**: The server broadcasts events to registered webhooks immediately upon ingestion.
*   **Pull**: Clients poll the server continuously to synchronize their local log package with the latest server state.


## 🚀 Core Concept

The project is built on the principle that log reporting should be both efficient and highly specific. Instead of overwhelming consumers with every system event, EventSync uses a hierarchical tagging system. 

### Scalable Tagging
Logs are tagged using a `CATEGORY.CODE` structure:
*   `DATABASE.CONNECTION_LOST`
*   `FILESYSTEM.FILE_MISSING`
*   `AUTH.INVALID_TOKEN`

This is highly scalable because it ensures that **only the specific logs a user needs** are reported to them, significantly reducing noise and bandwidth.


## ✨ Key Features

*   **Dual-Mode Consumption**: Supports active polling (Pull) for UI state and Webhook delivery (Push) for automated responses.
*   **Incremental Sync**: Clients fetch updates using a `since` ID cursor to avoid redundant data transfer.
*   **Delivery Auditing**: Every webhook attempt is logged with HTTP status codes and error details for reliability tracking.
*   **Extensible**: While currently using webhooks, the notification engine is decoupled and can be easily refactored to support Email (SMTP) or SMS.


## 🛠 Architecture

1.  **Producers**: Internal systems or scripts send structured logs to the `/internal/log` endpoint.
2.  **Server**: A Flask-based API manages the SQLite store and orchestrates the broadcast logic.
3.  **Polling Clients**: Dashboards hit `/api/logs` to synchronize local state with the server.
4.  **Webhook Consumers**: The server identifies active subscriptions matching the log tag and pushes the payload to registered callback URLs.


## 📡 API Reference

### Ingest a Log (Internal)
**POST** `/internal/log`
```json
{
  "category": "DATABASE",
  "code": "CONNECTION_LOST",
  "message": "Lost connection to primary node"
}
```

### Poll for Updates (Client)
**GET** `/api/logs?since=100`
Returns all logs with an ID greater than 100.


## ⚙️ Setup & Installation

1.  **Install Dependencies**:
    ```bash
    pip install flask requests
    ```
2.  **Run the Server**:
    ```bash
    python run.py
    ```
    The server will start at `http://127.0.0.1:5000`.


## 📝 License
MIT
