# Daily Logs Excel Export API Documentation

## Overview

The Daily Logs Excel Export API allows users to export daily log data into comprehensive Excel reports with multiple worksheets for analysis and reporting.

## Endpoint

```
GET /dailylog/reports/export-excel
```

## Query Parameters

### Mandatory Filters (At least one required)

1. **project** (UUID) - Project ID
   - Export logs for a specific project
   - Example: `?project=550e8400-e29b-41d4-a716-446655440000`

2. **user** (UUID) - User ID
   - Export logs for a specific user
   - Example: `?user=550e8400-e29b-41d4-a716-446655440001`

3. **department** (UUID) - Department ID
   - Export logs for a specific department (via task association)
   - Example: `?department=550e8400-e29b-41d4-a716-446655440002`

### Optional Filters

1. **fromDate** (YYYY-MM-DD) - Start date (inclusive)
   - Must be paired with `toDate`
   - Cannot be in the future
   - Example: `&fromDate=2026-01-01`

2. **toDate** (YYYY-MM-DD) - End date (inclusive)
   - Must be paired with `fromDate`
   - Cannot be in the future
   - Maximum range: 365 days (1 year)
   - Example: `&toDate=2026-02-26`

## Example Requests

### Export logs for a project

```
GET /dailylog/reports/export-excel?project=550e8400-e29b-41d4-a716-446655440000&fromDate=2026-01-01&toDate=2026-02-26
```

### Export logs for a specific user

```
GET /dailylog/reports/export-excel?user=550e8400-e29b-41d4-a716-446655440001
```

### Export logs for a department

```
GET /dailylog/reports/export-excel?department=550e8400-e29b-41d4-a716-446655440002&fromDate=2026-02-01&toDate=2026-02-26
```

### Export logs for multiple filters

```
GET /dailylog/reports/export-excel?project=550e8400-e29b-41d4-a716-446655440000&user=550e8400-e29b-41d4-a716-446655440001&fromDate=2026-01-01&toDate=2026-02-26
```

## Response Format

### Success Response

- **Status Code**: 200
- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Response**: Binary Excel file (.xlsx)
- **Headers**:
  ```
  Content-Disposition: attachment; filename="Daily-Logs-Report-2026-02-26-142530.xlsx"
  ```

### Error Response

```json
{
  "success": false,
  "status": 400,
  "message": "At least one filter (project, user, or department) is required"
}
```

## Excel Report Structure

The exported Excel file contains 6 worksheets:

### 1. **Detailed Logs** Sheet

Complete list of all logs matching the filters with:

- Date
- User Name
- Project Name
- Task Title
- Priority
- Task Status
- Duration (hours)
- Log Type (standup/wrapup)
- Notes

### 2. **Project Summary** Sheet

Aggregated statistics by project:

- Project Name
- Total Logs
- Total Hours
- Unique Users
- Unique Tasks

### 3. **Task Summary** Sheet

Aggregated statistics by task:

- Task Title
- Project Name
- Priority
- Status
- Total Logs
- Total Hours
- Users Assigned

### 4. **User Summary** Sheet

Aggregated statistics by user:

- User Name
- Email
- Total Logs
- Total Hours
- Projects (count)
- Tasks (count)

### 5. **Department Summary** Sheet

Aggregated statistics by department:

- Department ID
- Total Logs
- Total Hours
- Unique Users
- Projects (count)
- Tasks (count)

### 6. **Overall Summary** Sheet

High-level report statistics:

- Report Generated (timestamp)
- Total Logs
- Total Hours
- Unique Users
- Unique Projects
- Unique Tasks
- Date Range (if filtered)
- Applied Filters

## Validation Rules

### Filter Validation

- ❌ **At least one of project, user, or department must be provided**
- ❌ **Both fromDate and toDate must be provided together**

### Date Validation

- ❌ **Dates cannot be in the future**
- ❌ **Start date cannot be after end date**
- ❌ **Date range cannot exceed 365 days**
- ✅ **Date format must be YYYY-MM-DD**

## Error Messages

| Error                    | Status | Message                                                          |
| ------------------------ | ------ | ---------------------------------------------------------------- |
| Missing mandatory filter | 400    | "At least one filter (project, user, or department) is required" |
| Missing date pair        | 400    | "Both fromDate and toDate must be provided together"             |
| Invalid date format      | 400    | "Invalid date format. Use YYYY-MM-DD"                            |
| Future date              | 400    | "End date cannot be in the future"                               |
| Invalid date range       | 400    | "Start date cannot be after end date"                            |
| Exceeds max range        | 400    | "Date range cannot exceed 365 days (1 year)"                     |
| No matching data         | 404    | "No logs found matching the provided filters"                    |
| Server error             | 500    | "Error generating Excel report"                                  |

## Usage Examples

### cURL

```bash
# Export project logs with date range
curl -X GET "https://pms.local.test/pms_mod/dailylog/reports/export-excel?project=UUID&fromDate=2026-01-01&toDate=2026-02-26" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o report.xlsx
```

### JavaScript/Fetch

```javascript
async function exportLogs(filters) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/dailylog/reports/export-excel?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Daily-Logs-Report.xlsx";
    a.click();
  }
}

// Usage
exportLogs({
  project: "550e8400-e29b-41d4-a716-446655440000",
  fromDate: "2026-01-01",
  toDate: "2026-02-26",
});
```

### Python

```python
import requests
from datetime import datetime

def export_daily_logs(project_id, from_date, to_date, token):
    url = "https://pms.local.test/pms_mod/dailylog/reports/export-excel"
    params = {
        'project': project_id,
        'fromDate': from_date,
        'toDate': to_date
    }
    headers = {
        'Authorization': f'Bearer {token}'
    }

    response = requests.get(url, params=params, headers=headers)

    if response.status_code == 200:
        with open('Daily-Logs-Report.xlsx', 'wb') as f:
            f.write(response.content)
        print("Report exported successfully!")
    else:
        print(f"Error: {response.status_code}")
        print(response.json())

# Usage
export_daily_logs(
    '550e8400-e29b-41d4-a716-446655440000',
    '2026-01-01',
    '2026-02-26',
    'YOUR_TOKEN'
)
```

## Performance Considerations

- **Large datasets**: For exports with 10,000+ logs, processing may take 5-30 seconds
- **Date range**: Narrower date ranges improve performance
- **Filters**: Using multiple filters (project + user) reduces data size
- **Memory**: The API loads all matching logs into memory before creating the Excel file

## Installation (Dependencies)

Make sure to install required packages:

```bash
npm install exceljs moment
```

## Version History

| Version | Date       | Changes                                         |
| ------- | ---------- | ----------------------------------------------- |
| 1.0.0   | 2026-02-26 | Initial release with Excel export functionality |

## Notes

- All times are displayed in hours (decimal format)
- Empty cells are displayed as "-" for missing data
- The report includes data from both standup and wrapup logs
- Department information is extracted from task associations
- All timestamps are in server timezone
