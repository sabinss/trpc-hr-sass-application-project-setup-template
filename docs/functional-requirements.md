# Novelty HR SaaS — Phase 1 Functional Requirements

## 1. Purpose

This document defines what the Phase 1 HR SaaS application must do. It is written to guide database design, API design, and implementation planning.

The product is a multi-tenant web application for organizations to manage employees, onboarding, employment records, leave/WFH, attendance, timesheets, and HR workflows.

This document describes functional behavior. It does not prescribe table names or a physical database schema.

## 2. Product scope

### 2.1 Tenant model

- A **tenant** is a customer organization using the HR SaaS application.
- Tenant data must be isolated. A user from one tenant must never read, modify, export, or receive files belonging to another tenant.
- Every tenant-owned business record must belong to exactly one tenant.
- A tenant may have multiple internal locations, departments, employment types, and policies.
- A tenant has one configured timezone used as the default for date-sensitive workflows.
- Platform-level support operations, if introduced, must use explicitly audited support access and must not bypass tenant isolation by default.

### 2.2 Phase 1 roles

Each active user has one or more of the following fixed roles within a tenant:

| Role     | Functional access                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------- |
| Employee | Manages own permitted profile data, onboarding, requests, attendance, and timesheet view.                |
| Manager  | Has Employee access for self, plus authorized direct-report/team visibility and approvals.               |
| HR Admin | Manages tenant employees, configuration, onboarding, policies, organization-wide workflows, and HR data. |

- A Manager retains all applicable Employee access for their own record.
- Role checks and employee/team scope checks must be enforced by the server for every protected operation.
- Phase 1 does not require configurable custom roles or per-button permission management.

### 2.3 Out of scope for Phase 1

- Payroll, overtime, reimbursement, and compensation processing
- Full performance-management or KPI module
- Advanced reporting/data warehouse
- Organization chart
- Standalone learning-management system
- Custom role builder

## 3. Core functional requirements

## FR-01: Tenant and organization management

1. The platform must create and maintain tenant organizations.
2. An HR Admin must be able to view and update permitted organization settings.
3. The organization must have a name, timezone, active status, and creation/audit timestamps.
4. The organization must maintain configurable reference data used by employee and workflow records:
   - Departments
   - Designations
   - Job families
   - Career levels
   - Locations
   - Employment types
   - Employment statuses
5. Reference data values must be tenant-specific, active/inactive, auditable, and protected from deletion when already referenced. Inactivation is preferred over destructive deletion.
6. The system must maintain tenant holidays and company events.

## FR-02: User identity and authentication

1. A user account represents a login identity and may be linked to one employee record per tenant.
2. The application must support:
   - Email/password authentication
   - Google OpenID Connect single sign-on
3. Email/password and Google authentication must resolve to the same user identity when they represent the same authorized person.
4. A user account must track authentication state, activation state, invitation state, and last successful sign-in information.
5. A user may not access tenant data until authenticated and associated with an authorized tenant membership.
6. The application must support session creation, expiry, revocation, and sign-out.
7. Passwords must never be stored in plaintext. Authentication secrets and third-party credentials must not be stored in application source code.

## FR-03: Tenant membership, roles, and access scope

1. A tenant membership connects a user account to a tenant and identifies their active role or roles.
2. The system must support users who belong to more than one tenant, with an explicit active-tenant context per session.
3. An employee record must be associated with its tenant membership.
4. Employee records must support a reporting relationship to a manager within the same tenant.
5. Access scope rules:
   - Employee: own records and permitted colleague directory information only.
   - Manager: own records plus authorized direct reports and assigned approval work.
   - HR Admin: tenant-wide access for authorized HR functions.
6. Managers must not access another employee's financial information or documents.
7. Exports, dashboards, notifications, file links, and integration queries must apply the same tenant and role scope as standard views.

## FR-04: Employee lifecycle and employee master record

1. HR Admins must be able to create an employee with:
   - Full name
   - Company email
   - Designation
   - Role
   - Start date
2. The system must generate a tenant-unique employee identifier. The identifier must remain unique if employees are created concurrently.
3. A new employee must initially receive the `New Hire` employment status unless a confirmed business rule permits another initial state.
4. The system must support employee lifecycle states at minimum:
   - New Hire
   - Probation
   - Active
   - Resigned
   - Inactive
5. Lifecycle transitions must be validated, dated, and auditable.
6. An employee must have separate current employment details and historical employment changes.
7. The employee master record must track:
   - Tenant
   - Employee identifier
   - Linked user/membership where available
   - Current status
   - Start/joining date
   - Current manager
   - Creation and update audit information
8. Employee records must not be permanently deleted through normal HR workflows. Termination/inactivation preserves history.

## FR-05: Employee profile and employment history

1. The employee profile must support:
   - Overview
   - Personal information
   - Employment details
   - Financial information
   - Documents
   - Attendance summary
   - Leave/WFH summary
   - Employment history / My Journey
2. Personal-profile fields must support configuration of:
   - Field definition
   - Required/optional status
   - Employee-owned or HR-owned edit responsibility
   - Active/inactive status
3. Current employment details must include:
   - Designation
   - Job family
   - Career level
   - Department
   - Manager
   - Location
   - Employment type
   - Joining date
   - Employment status
4. HR must be able to update employment details either as:
   - An administrative correction without history, or
   - A recorded employment change.
5. An employment-change record must capture change type, effective date, reason, optional HR notes, changed fields, actor, and timestamp.
6. Employees can view their own employee-facing history but must not view HR-only notes.
7. Financial data and documents are available only to the employee themself and HR Admins.

## FR-06: Employee directory and employee administration

1. Authorized users must be able to search, sort, filter, and paginate the tenant employee directory.
2. The directory must show only information permitted to the viewer.
3. The default directory information includes name, designation, department, manager, location, joining date, and employment status.
4. HR Admins can access full employee profiles and permitted employee actions.
5. Managers can access only permitted direct-report details and actions.
6. Employees can access their own full profile and limited colleague details.
7. Directory exports must preserve active filters and enforce the requestor's tenant and role scope.
8. The system may show permitted birthday, work anniversary, leave, and WFH indicators without exposing restricted details.

## FR-07: Employee invitations and onboarding

1. HR Admins must be able to create an employee account without sending an invitation, send an invitation immediately, or schedule an invitation for a future date/time.
2. An invitation must track:
   - Tenant and employee
   - Recipient address
   - Status: No Invite Sent, Scheduled, Sent, Opened, Accepted, Expired, Cancelled
   - Scheduled/sent/opened/accepted/expiry timestamps
   - Delivery attempts and safe error details
3. HR Admins must be able to cancel, reschedule, send, and resend invitations according to invitation status.
4. Scheduled invitations must not be created for past date/times and must use the tenant timezone.
5. Onboarding must have three ordered steps:
   - Welcome documents, introduction, and employee-provided details
   - Security and compliance training/exam
   - MFA and acknowledgements
6. Each onboarding step must track status, required tasks, completion timestamp, and evidence of completion where applicable.
7. Required onboarding tasks must prevent step completion until satisfied.
8. Welcome documents must support required/optional status and versioning.
9. The compliance exam must support questions, allowed question types, correct answers, passing threshold, retry limit, attempts, scores, and pass/fail result.
10. Exam-attempt notifications to HR must be batched rather than sent once per attempt.
11. Acknowledgements must preserve the acknowledgement text/version, actor, timestamp, and required completion state.
12. The business must confirm MFA provider, recovery process, signature/acknowledgement evidence, and final lifecycle transition conditions before those features are finalized.

## FR-08: Leave policy and leave balance management

1. HR Admins must configure leave policies per tenant.
2. A leave policy must support at minimum:
   - Leave type
   - Effective date range
   - Eligible population/rules
   - Entitlement and balance rules
   - Active/inactive state
3. The system must record leave balances by employee, policy/leave type, and relevant leave period.
4. The system must preserve balance adjustments with reason, actor, source, timestamp, and resulting balance.
5. Balance updates must be transactional and must not create negative or otherwise invalid balances.
6. Accrual, carry-forward, expiry, partial-day, and exception rules require business confirmation before implementation.

## FR-09: Leave and work-from-home requests

1. Employees must be able to create, view, and track their own leave and WFH requests.
2. A request must include:
   - Request type
   - Employee
   - Date range
   - Reason where required
   - Current workflow status
   - Submitted timestamp
3. The system must validate date ranges, policy constraints, duplicate submissions, overlaps, and request status transitions.
4. Leave requests must validate available balance according to the approved policy rules.
5. Managers must view and act only on requests from authorized direct reports or assigned approval workflows.
6. HR Admins must have authorized tenant-wide request visibility and override actions.
7. Each approval decision must store decision, approver, decision timestamp, optional comment, and workflow sequence/status.
8. Overrides and administrative adjustments must be auditable.
9. Approved requests must be available as a role-scoped source for calendars, directory indicators, profile summaries, and dashboards.

## FR-10: Attendance and holiday calendar

1. The system must record employee attendance events and/or daily attendance records.
2. Attendance data must support a source type, source identifier, source timestamp, normalized tenant-local work date, and import/audit information.
3. Employees can view their own attendance history.
4. Managers can view authorized team attendance.
5. HR Admins can view tenant-wide attendance.
6. The system must calculate employee dashboard attendance summaries, including average check-in and check-out, using a documented calculation.
7. Tenant holidays must be stored once and reused by calendars and relevant date-aware workflows.
8. Biometric imports must be idempotent: repeated source records cannot create duplicate attendance records.
9. Unmatched or invalid biometric records must be retained for authorized reconciliation without exposing them to unauthorized users.
10. Attendance settings, source mapping, and timezone rules require confirmation from the detailed attendance requirements and provider contract.

## FR-11: Timesheets, productivity, and Jira integration

1. Jira worklogs are the required source for logged time; attendance must not be substituted for worklogs.
2. The system must map a tenant employee to their approved Jira identity.
3. Worklog synchronization must record:
   - Tenant and employee
   - Jira source identifier
   - Work date and logged duration
   - Sync timestamp and source metadata
4. Synchronization must be idempotent and must not double-count a worklog on repeated sync.
5. The system must retain integration execution status, last successful sync, failure information, and retry state for authorized administrators.
6. Employees see their own timesheet/productivity information; Managers see authorized team information; HR Admins see tenant/department-level information.
7. Productivity must compare logged hours to expected hours using an approved business formula.
8. Expected-hours source, formula, historical sync range, and Jira authentication model require business confirmation.

## FR-12: Calendar, dashboards, announcements, and notifications

1. The tenant calendar must show holidays, company events, and role-permitted leave/WFH entries.
2. Dashboards must be role-specific:
   - Employee: own productivity, attendance, leave/WFH summary, and permitted score data.
   - Manager: team headcount, team leave/WFH, pending approvals, and team productivity.
   - HR Admin: tenant headcount, tenant leave/WFH, pending approvals, workforce events, and tenant productivity.
3. Dashboard values must be calculated from authoritative source records and respect the viewer's tenant and role scope.
4. Missing source data must produce an understandable empty/unavailable state, not a misleading business value.
5. HR Admins must be able to create and manage tenant announcements.
6. Users must receive only notifications authorized for their tenant, role, and record scope.
7. Notifications must support read/unread state if the feature is included in the final product requirements.
8. The system must support notifications for invitations, approvals, onboarding events, and batched compliance-exam summaries.

## FR-13: Documents and file access

1. HR Admins must be able to associate authorized documents with a tenant, employee, or onboarding requirement.
2. Documents must have metadata including owner/subject, document type, storage reference, uploaded timestamp, uploader, version, and status.
3. Document download/view access must be authorized before a short-lived file URL is issued.
4. Managers must not access employee financial documents or restricted employee documents.
5. The system must support document retention and replacement/version history according to the approved policy.
6. Actual document content must reside in private encrypted object storage rather than in the primary relational database.

## FR-14: Audit, data retention, and operational records

1. The application must create audit events for important administrative and workflow actions, including:
   - Employee creation and lifecycle changes
   - Employment-detail changes
   - Policy/configuration changes
   - Invitations and onboarding completion
   - Leave/WFH decisions and overrides
   - Sensitive document/financial access where required
   - Integration failures and reconciliation actions
2. An audit event must identify tenant, actor, action type, target entity, target identifier, timestamp, and safe change metadata.
3. Audit events must not store secrets or unmasked sensitive values unnecessarily.
4. Data retention, deletion, export, and legal-hold requirements must be agreed before production launch.
5. Scheduled jobs and integrations must retain operational status sufficient to diagnose failures and support safe retry.

## 4. Database design rules derived from the requirements

The database design must satisfy the following rules:

1. **Tenant key:** Add a tenant identifier to every tenant-owned table. Enforce tenant isolation in application queries and, where feasible, database policies.
2. **Stable IDs:** Use immutable internal primary keys. Treat employee IDs and provider IDs as business identifiers with explicit unique constraints.
3. **Reference integrity:** Use foreign keys for employee, user, policy, request, approval, and configuration relationships.
4. **Soft lifecycle:** Prefer active/inactive or archived state over destructive deletion for HR records, reference data, policies, documents, and employee records.
5. **Temporal history:** Model current employment details separately from dated employment-history events. Preserve effective dates for policy and employment changes.
6. **Workflow state:** Store explicit status values and transition history for invitation, onboarding, leave/WFH, approval, and integration workflows.
7. **Transactions:** Apply database transactions to coupled operations, especially leave approval plus balance adjustment, employee creation plus invitation state, and employment changes plus history events.
8. **Idempotency:** Store external source IDs and unique constraints for Jira worklogs, biometric records, webhook events, and retried jobs.
9. **Auditability:** Include created/updated timestamps and actor identifiers on mutable records; use a dedicated audit-event record for significant actions.
10. **Date/time:** Store instants in UTC, retain the tenant timezone, and use explicit date-only fields for leave, holiday, and other business-date concepts.
11. **Sensitive information:** Separate and restrict financial/document metadata. Use encryption at rest, field-level encryption where warranted, and redacted application logs.
12. **Indexes:** Plan indexes for tenant + status/date queries, employee/manager lookups, directory search/filtering, pending approvals, attendance by work date, and integration source IDs.

## 5. Initial logical entities

The following entities are expected during database design. Final normalization and relationship cardinality should be approved through an ERD review.

| Area                | Logical entities                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| SaaS tenancy        | Tenant, Tenant Settings, Tenant Membership, Role Assignment                                                                               |
| Identity            | User Account, Authentication Identity, Session, Invitation                                                                                |
| Organization setup  | Department, Designation, Job Family, Career Level, Location, Employment Type, Employment Status, Holiday, Company Event                   |
| Employee            | Employee, Employee Profile Field Definition, Employee Profile Value, Employment Detail, Employment History Event, Reporting Relationship  |
| Onboarding          | Onboarding Program/Step, Employee Onboarding Progress, Onboarding Document, Compliance Exam, Exam Question, Exam Attempt, Acknowledgement |
| Leave/WFH           | Leave Policy, Leave Type, Leave Balance, Balance Adjustment, Leave Request, WFH Request, Approval Step, Approval Decision                 |
| Attendance          | Attendance Record/Event, Attendance Import Batch, Attendance Reconciliation Item                                                          |
| Time tracking       | Jira Connection, Employee Jira Mapping, Worklog, Sync Run                                                                                 |
| Communications      | Announcement, Notification, Notification Delivery/Read State                                                                              |
| Documents           | Document Metadata, Document Version, File Access Event                                                                                    |
| Platform operations | Audit Event, Job Execution, Integration Failure/Retry                                                                                     |

## 6. Decisions required before schema approval

The following must be confirmed before finalizing the related data model:

1. Does every customer organization map to one tenant, or is a parent organization with multiple legal entities required?
2. Can a user be a member of multiple tenants in Phase 1?
3. What are the exact employee lifecycle transition rules?
4. What leave policy rules apply to entitlements, accruals, partial days, carry-forward, expiry, and approval routing?
5. What are the attendance states, source records, correction rules, and timezone policy?
6. How are expected hours calculated, and what is the approved productivity formula?
7. Which MFA provider and acknowledgement/signature evidence are required?
8. What are the email invitation expiry, resend, and account-linking rules?
9. What are the Jira and biometric identity mappings, sync schedules, retry rules, and source-retention requirements?
10. What data-retention, deletion, export, and privacy obligations apply to each tenant?

## 7. Acceptance criteria for database design

The database design is ready for implementation when:

- Every tenant-owned entity has an unambiguous tenant relationship.
- All role and record-scope paths can be enforced without relying on UI-only checks.
- Employee, reporting, employment-history, onboarding, request, approval, and audit relationships are represented.
- Leave balances and approvals can be updated atomically.
- External imports can be retried without duplication.
- Sensitive data boundaries are represented in the schema and access layer.
- Required history can be preserved without overwriting important employment or workflow facts.
- An ERD, migration plan, seed/reference-data plan, and index plan have been reviewed by Engineering and HR/Product.
