# 📘 PMS + Code & File Management Architecture Documentation

---

## 🧠 1. Overview

This document defines the architecture for integrating:

- 📁 File Management (S3)
- 💻 Code Management (Gitea)

into PMS using a **separate backend service**.

---

## 🎯 2. Goals

- Single unified PMS UI
- Separate backend responsibility
- Clean scalability
- No direct user access to Git system

---

## 🧩 3. System Architecture

```
Frontend (React - PMS UI)
        |
        v
Gateway (Nginx)
        |
        v
---------------- Backend Layer ----------------
|                                             |
|   PMS Core Service                          |
|     - projects                              |
|     - tasks                                 |
|     - time tracking                         |
|                                             |
|   DevOps Service (NEW 🔥)                   |
|     - File Management (S3)                  |
|     - Code Management (Gitea)               |
|                                             |
-----------------------------------------------
        |                              |
        v                              v
     S3 Storage                    Gitea
```
---

## 🧠 4. Core Principles

- PMS = Business logic controller
- DevOps Service = Code + File handler
- Clear separation of concerns
- Unified frontend

---

## 📁 5. DevOps Service Responsibilities

### File Management
- upload
- download
- metadata
- S3 integration

### Code Management
- repo handling
- branch creation
- commit tracking
- merge handling
- webhook processing

---

## 🔄 6. Communication Flow

### File Flow
User → PMS → DevOps Service → S3

### Code Flow
User → PMS → DevOps Service → Gitea

---

## 🗂️ 7. Code Viewing

- DevOps Service maintains local repo clone
- PMS requests:
  - file tree
  - file content

---

## 🔄 8. Development Workflow

1. User starts task
2. PMS → DevOps Service creates branch
3. User works locally
4. Push → Gitea → webhook → DevOps Service
5. DevOps Service updates PMS

---

## 🔐 9. Merge & Conflict Handling

- PMS triggers merge
- If conflict:
  - redirect to Gitea PR
- After merge:
  - webhook updates DevOps Service → PMS

---

## 👀 10. Code Activity

- recent commits
- file changes
- branch status

---

## 🔗 11. Data Ownership

### PMS DB
- projects
- tasks
- users

### DevOps Service DB
- file metadata
- code sessions
- repo mapping

---

## ⚠️ 12. Edge Cases

- concurrent edits → conflict
- abandoned branches
- stale repos
- failed merges

---

## 🔐 13. Security

- no direct Gitea exposure
- controlled redirect only
- auth via Keycloak
- internal service communication secured

---

## 🧠 14. Frontend Structure

Project Page
 ├── Overview
 ├── Tasks
 ├── Files
 └── Code

---

## 🚀 15. Future Enhancements

- diff viewer
- commit-task linking
- advanced merge UI

---

## 🔥 Final Summary

- PMS handles business logic
- DevOps Service handles files + code
- Gitea = Git engine
- S3 = file storage

---

**End of Document**
