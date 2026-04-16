# 📁 FileStream Requirement

## Overview
FileStream is a file workflow and approval system designed for managing project documents.

It does not manage projects or employees directly; instead, it integrates with:
- **PMS (Project Management System)** – for projects, employee assignments, and department-based workflow configuration.
- **Keycloak** – for authentication, multi-tenant SSO, and role-based access.

FileStream’s key responsibility is to manage:
- File uploads
- Versioning
- Approvals
- QA
- Reporting

All based on the department flow defined in PMS.

---

## 1. Authentication & Authorization

- Managed by **Keycloak (multi-tenant SSO)**
- Roles:
  - Uploader
  - Reviewer
  - Approver
  - Admin

### Behavior:
- FileStream extracts:
  - `organization_id`
  - roles from JWT
- Enforces role-based access
- Ensures tenant-level data isolation

---

## 2. Project Integration & Department Flow

- Managed in PMS:
  - Projects
  - Employee assignments
  - Department workflows

- FileStream:
  - Consumes via API / scheduled sync
  - Executes workflow (does not define it)

### Dynamic Workflow Example:
1. Designer uploads design
2. Developer uploads code after approval
3. Demo files auto-pushed
4. Tester reviews
5. If issues → sent back to Developer/Designer
6. QA approval → Manager/Admin
7. Final release to Production

> ⚠️ Workflow is dynamic and fully controlled by PMS

---

## 3. File Management

### Upload & Storage
- Files uploaded per project
- Controlled by role & department stage
- Stored securely (S3)

### Version Control
- Each update = new version
- Previous versions available

### Metadata
- uploader
- department
- upload date
- file type
- comments
- version

### Access Control
- Based on role + workflow stage

---

## 4. Workflow & Approvals

### Dynamic Workflow
- Based on PMS configuration
- Example flow:

>> Designer → Developer → Tester → Manager → Production


### Role-Based Actions
- **Uploader** → upload files
- **Reviewer/QA** → approve/reject
- **Approver/Manager** → final decision

### Features
- Automatic routing between departments
- Supports rework loops

### Audit Trail
- Logs:
- user
- department
- timestamp
- action

---

## 5. QA / Review System

- Reviewers can:
- Comment
- Approve
- Reject
- Send for rework

- Supports:
- Loop back to previous departments
- Full audit tracking

---

## 6. Notifications & Alerts

### Triggered On:
- New uploads
- Pending approvals
- Approval/rejection
- Rework requests

### Channels:
- Email
- In-app

---

## 7. Reports & Analytics

### Project Reports
- File status:
- Draft
- Under Review
- Approved
- Final
- Current stage

### Timeline Reports
- Time per department
- Rework count
- SLA tracking

### Activity Logs
- Uploads
- Reviews
- Approvals
- Rejections

---

## 9. Non-Functional Requirements

### Scalability
- Supports thousands of files/projects

### Security
- Encryption (at rest & transit)
- RBAC
- Audit logs

### Performance
- Fast upload/download
- Optimized queries

### Reliability
- Versioning
- Rollback support
- Fault tolerance

### Multi-Tenant
- Strict organization-level isolation

---

## 10. Example Dynamic Flow

1. Designer uploads `Design_v1.pdf` → Draft
2. Developer uploads code after approval
3. Demo files auto-generated
4. Tester reviews:
 - If issues → back to Developer/Designer
5. QA approves
6. Manager/Admin final approval
7. File moves to Production (locked)

---

## ⚠️ Important Note

- Workflow is **fully dynamic**
- Defined and controlled by PMS
- FileStream only:
- Executes
- Tracks
- Automates