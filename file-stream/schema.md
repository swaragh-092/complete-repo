# 🗄️ FileStream Database Schema

## Overview
This schema supports a **multi-tenant file workflow system** with:
- File versioning
- Dynamic workflow tracking
- Approval/review system
- Audit logging

---

## Tables Overview

1. files  
2. file_versions  
3. file_workflow  
4. file_actions  
5. file_comments  

---

## 1. files

Represents a logical file in a project.

```sql
files (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  current_version INT DEFAULT 1,

  status VARCHAR(50), -- DRAFT, UNDER_REVIEW, APPROVED, REJECTED, FINAL

  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 2. file_versions

Each upload creates a new version.

```sql
file_versions (
  id UUID PRIMARY KEY,
  file_id UUID REFERENCES files(id),

  version_number INT NOT NULL,

  storage_path TEXT NOT NULL, -- S3 key
  file_size BIGINT,
  file_type VARCHAR(100),

  uploaded_by UUID,
  department VARCHAR(100),

  comments TEXT,

  created_at TIMESTAMP
);
```

## 3. file_workflow

Tracks the current workflow state of a file.

```sql
file_workflow (
  id UUID PRIMARY KEY,
  file_id UUID REFERENCES files(id),

  current_department VARCHAR(100),
  current_stage INT,

  status VARCHAR(50), -- PENDING, IN_PROGRESS, APPROVED, REJECTED

  assigned_to UUID,

  updated_at TIMESTAMP
);
```

## 4. file_actions

Stores all workflow actions (audit trail).

```sql
file_actions (
  id UUID PRIMARY KEY,

  file_id UUID REFERENCES files(id),
  version_id UUID REFERENCES file_versions(id),

  action_type VARCHAR(50), 
  -- UPLOAD, APPROVE, REJECT, REWORK, FORWARD

  from_department VARCHAR(100),
  to_department VARCHAR(100),

  performed_by UUID,

  remarks TEXT,

  created_at TIMESTAMP
);
```

## 5. file_comments

Stores review and QA comments.

```sql
file_comments (
  id UUID PRIMARY KEY,

  file_id UUID REFERENCES files(id),
  version_id UUID REFERENCES file_versions(id),

  user_id UUID,
  department VARCHAR(100),

  comment TEXT,

  created_at TIMESTAMP
);
``` 


