# 📁 FileStream Architecture Approach

## Overview
FileStream is a **file workflow and approval system** that manages:
- Files (assets)
- Code (application source)

The system separates **file storage** and **code management** to handle both efficiently.

---

## Core Architecture

FileStream is divided into two main domains:

1. **Files (Assets)**
2. **Code (Application Source)**

---

## 1. Files (Assets Management)

### Purpose
Used for:
- Designs
- Images
- Documents
- Static assets

### Storage
- Stored in **Amazon S3**
- Organized using multi-tenant structure:

> org-{organization_id}/project-{project_id}/{file_type}/{file_name}


---

### Behavior

- Files are uploaded directly via FileStream
- No local file handling
- Files are referenced using **S3 paths/URLs**
- Developers use these URLs directly in code

---

### Versioning

- No explicit versioning
- Files are treated as final assets
- Changes controlled via workflow approvals

---

### Access Control

- Based on:
  - organization_id
  - user role
  - workflow stage

---

### Key Characteristics

- Simple and scalable
- No conflict issues
- Centralized asset management
- Works like a CDN-backed storage system

---

## 2. Code Management

### Purpose
Used for:
- Application source code
- Backend / frontend logic

---

### Approach

Code is managed using an **external Git-based system** integrated with FileStream.

- FileStream acts as:
  - UI layer
  - Workflow controller

- External system handles:
  - versioning
  - commits
  - diff/comparison
  - collaboration

---

### Recommended System

- Self-hosted Git service (e.g., Gitea)
- Fully controlled via backend APIs
- Not exposed directly to users

---

### Behavior

- Users interact only with FileStream UI
- All code operations are triggered via backend:
  - create repository
  - commit changes
  - fetch versions
  - compare changes

---

### Workflow Integration

- Code changes follow same approval flow:
  - Developer → QA → Manager → Production

- FileStream tracks:
  - current stage
  - approval status

- External system stores:
  - actual code
  - version history

---

### Data Mapping

FileStream stores references:

- repository identifier
- branch (optional)
- latest commit ID

---

### Key Characteristics

- Supports multiple developers
- No overwrite issues
- Built-in versioning and history
- Scalable and secure

---

## Combined Flow

### Files
1. Upload to S3
2. Approval workflow
3. Used via URL in code

### Code
1. Edit via FileStream UI
2. Commit via backend integration
3. Approval workflow
4. Deployment after approval

---

## System Responsibilities

| Component       | Responsibility              |
|----------------|-----------------------------|
| FileStream     | Workflow, approvals, UI     |
| Amazon S3      | File storage                |
| Git System     | Code storage & versioning   |
| Keycloak       | Authentication & roles      |
| PMS            | Project & workflow config   |

---

## Key Design Principles

- Separation of concerns (Files vs Code)
- Externalized code versioning
- Centralized workflow control
- Multi-tenant architecture
- Secure and scalable storage

---

## Summary

FileStream:
- Manages **files via S3**
- Manages **code via external Git system**
- Controls **workflow and approvals centrally**

This approach ensures:
- scalability
- flexibility
- proper handling of multi-developer environments
- clean separation between assets and code