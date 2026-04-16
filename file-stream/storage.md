# 📁 File Storage (Amazon S3)

## Overview
FileStream uses **Amazon S3** for storing all files.

The system follows a separation of concerns:
- **Metadata** → stored in database
- **Files** → stored in S3

---

## Bucket Structure

Files are stored using a **multi-tenant path structure**:
>> org-{organization_id}/project-{project_id}/{department}/{version}_{file_name}

### Example:
>> org-123/project-456/designer/v1_design.pdf  
>> org-123/project-456/developer/v2_code.zip


---

## Metadata

File metadata is stored in the database with a reference to the S3 object.

### Key Fields:
- file_id
- organization_id
- project_id
- file_name
- version
- department
- status
- storage_path (S3 key)
- created_at

---

## File Upload Flow

1. Client requests upload
2. FileStream validates:
   - user role
   - workflow stage
3. System generates a **pre-signed S3 upload URL**
4. Client uploads file directly to S3
5. Metadata is stored in database

---

## File Download Flow

1. Client requests file
2. FileStream validates access
3. System generates a **pre-signed S3 download URL**
4. Client downloads file directly from S3

---

## Versioning

- Each update creates a new file version
- versioning will be handled from the AWS, But Deletion will be handled by the application level (all deleted files will be moved to the deleted folder later can be restored from the application it self) (or will see even better option if possible)

### Example:
>> v1_file.pdf
>> v2_file.pdf
>> v3_file.pdf


---

## Security

- S3 bucket is **private**
- No public access allowed
- Access only via **pre-signed URLs**
- HTTPS enforced for all transfers

### Multi-Tenant Isolation:
>> org-{organization_id}/...



---

## Cost Consideration

- Upload: Free  
- Storage: ~ $0.023 per GB/month
- Download: Charged after free tier

---

## Summary

| Component | Responsibility |
|----------|----------------|
| Database | Metadata & workflow |
| S3       | File storage |