# Novelty EMS — Phase 1 Feature Breakdown & Delivery Plan

> **Purpose:** Turn the requirements document into an implementation roadmap that a Lead Engineer can use to plan, build, test, and release the application in small, dependency-aware increments.
>
> **Source:** Novelty EMS requirements document supplied with this request. This plan reorganizes the stated requirements into an engineering sequence; it does not replace Product decisions or add new Phase 1 modules.
>
> **Planning note:** The supplied document ends during **Module 05 — Onboarding, Step 3: MFA & Acknowledgements**. Items whose details are not present in the supplied text are marked **Needs requirements detail** rather than guessed.

---

## 1. Product goal

Build one web-based Employee Management System (EMS) for three fixed roles:

- **Employee:** manages their own profile, leave/WFH, attendance, timesheet, and onboarding.
- **Manager:** has Employee capabilities plus visibility into direct reports and team approvals/activity.
- **HR Admin:** manages employees, policies, configuration, onboarding, requests, and organization-wide workforce activity.

The Phase 1 web experience must provide the required functionality of the existing mobile employee experience before that mobile experience is retired.

## 2. How to use this roadmap

- Work through the priorities in order, but deliver each feature as a vertical slice: database/API, permissions, UI, tests, and audit/observability where relevant.
- A feature is **Done** only when its acceptance criteria and role-based access tests pass.
- Treat security, data integrity, date/status consistency, and error handling as cross-cutting requirements—not as final polish.
- Product should confirm the decisions in **Section 13** before the affected implementation is locked.
- This is a recommended dependency order, not a committed calendar estimate. Estimate each backlog item with the team.

### Priority definitions

| Priority | Meaning |
|---|---|
| **P0 — Foundation / release blocker** | Required before dependent modules can be safely built or released. |
| **P1 — Core Phase 1** | Main business workflows required for a useful EMS. |
| **P2 — Complete Phase 1** | Remaining in-scope capability or integration needed to meet the Phase 1 requirements. |
| **P3 — Deferred / out of scope** | Do not include in Phase 1 unless Product explicitly changes scope. |

---

## 3. Recommended build sequence

| Order | Epic | Priority | Depends on |
|---:|---|---|---|
| 0 | Requirements decisions and architecture baseline | P0 | None |
| 1 | Application foundation and data model | P0 | 0 |
| 2 | Authentication and employee identity | P0 | 1 |
| 3 | Fixed roles, authorization, and sensitive-data protection | P0 | 1–2 |
| 4 | Shared platform services: validation, statuses, dates, audit, notifications | P0 | 1–3 |
| 5 | Organization settings and configurable reference data | P1 | 1–4 |
| 6 | Employee creation, invitation, and onboarding lifecycle | P1 | 2–5 |
| 7 | Employee profile and employment history | P1 | 5–6 |
| 8 | Employee directory and employee administration | P1 | 3, 5–7 |
| 9 | Leave and WFH policies, requests, and approvals | P1 | 5, 8 |
| 10 | Attendance and holiday calendar | P1 | 5, 8 |
| 11 | Timesheet/productivity and Jira worklogs | P1/P2 | 3, 5, 8 |
| 12 | Calendar and workforce events | P1/P2 | 9–11 |
| 13 | Role-specific dashboards | P1/P2 | 8–12 |
| 14 | Announcements and notification center | P2 | 4, 6, 9–13 |
| 15 | Biometric integration | P2 | 10 |
| 16 | Data migration, reconciliation, and cutover | P0 for launch | Stable target modules |
| 17 | End-to-end hardening and web replacement readiness | P0 for launch | All required Phase 1 modules |

**Why dashboards come later:** the dashboards aggregate employee, leave/WFH, attendance, and Jira worklog data. Build them after the underlying records and permissions are reliable.

---

# 4. Detailed implementation backlog

## EPIC 0 — Requirements decisions and architecture baseline

**Priority:** P0  
**Goal:** Remove ambiguity before it becomes expensive rework.

### Tasks

- [ ] **0.1 — Confirm the Phase 1 scope**
  - Record in-scope modules and the explicit out-of-scope/deferred list in Section 11.
  - Confirm the web application replaces the required existing mobile employee functionality before mobile retirement.
- [ ] **0.2 — Confirm role and access model**
  - Keep the three fixed roles: Employee, Manager, HR Admin.
  - Confirm that a Manager retains Employee access for their own records.
  - Confirm module-level permission granularity; do not build a configurable per-button permission engine in Phase 1.
- [ ] **0.3 — Confirm employee lifecycle**
  - Use `New Hire` at account creation unless Product confirms `Pre-Hire` is a separate state.
  - Confirm the transitions from New Hire → Probation → Active → Resigned/Inactive.
- [ ] **0.4 — Confirm data ownership**
  - For each profile/onboarding field, specify whether HR or the employee supplies it, whether it is required, and who may edit it.
- [ ] **0.5 — Confirm integration contracts**
  - Google SSO, email/password, email delivery/scheduling, Jira worklogs, and biometric source/device/API.
- [ ] **0.6 — Confirm deployment and operational expectations**
  - Environments, secrets, backups, monitoring, retention, recovery, and production access.

### Deliverables

- [ ] Approved Phase 1 scope and decision log.
- [ ] High-level architecture and data-flow diagram.
- [ ] Initial entity relationship diagram.
- [ ] API conventions, validation/error format, date/time convention, and status naming rules.
- [ ] Integration contract notes for external systems.

### Exit criteria

- No unresolved decision blocks identity, authorization, employee lifecycle, or core data modeling.
- Every unresolved decision has an owner and due date.

---

## EPIC 1 — Application foundation and data model

**Priority:** P0  
**Goal:** Establish a stable base for all modules.

### Tasks

- [ ] **1.1 — Create application skeleton**
  - Frontend shell, backend API, database connection, environment configuration, and deployment configuration.
  - Establish local development and test environments.
- [ ] **1.2 — Define shared data conventions**
  - Consistent IDs, timestamps, date-only values, status fields, pagination, sorting, and filtering.
  - Use one documented date representation across date-related modules.
- [ ] **1.3 — Design core entities**
  - Employee/user identity.
  - Role and reporting relationship (manager/direct reports).
  - Organization reference data such as department, designation, job family, career level, location, and employment type.
  - Employee profile, employment details, and employment history.
  - Leave/WFH policies and requests.
  - Attendance records and holiday calendar.
  - Timesheet/worklog references.
  - Onboarding steps, documents, exam configuration/attempts, acknowledgements, invitations.
  - Announcements, notifications, audit events, and integration configuration as required by the modules.
- [ ] **1.4 — Add database constraints and indexes**
  - Enforce required fields and valid relationships.
  - Prevent duplicate employee IDs and other identifiers that must be unique.
  - Add indexes for directory search/filter, employee relationships, request status/date, and dashboard queries as appropriate.
- [ ] **1.5 — Define migration and seed strategy**
  - Version schema migrations.
  - Seed the three fixed roles and necessary reference data.
  - Keep development/demo seed data separate from production data.
- [ ] **1.6 — Establish test foundations**
  - Unit, API/integration, authorization, and end-to-end test conventions.
  - Include realistic date-boundary and invalid-data test cases.

### Acceptance criteria

- A clean environment can be initialized from documented steps.
- Migrations run reliably and are version-controlled.
- Core relationships and required values are enforced by the database and backend.
- Invalid or malformed values cannot silently enter core records.

---

## EPIC 2 — Authentication and employee identity

**Priority:** P0  
**Goal:** Allow approved users to sign in and resolve to one employee identity.

### Tasks

- [ ] **2.1 — Email/password authentication**
  - Implement sign-in with approved EMS credentials.
  - Handle invalid credentials with safe, user-friendly messages.
  - Apply secure password storage and session/token handling.
- [ ] **2.2 — Google SSO**
  - Implement Google account authentication for the organization.
  - Validate the provider response and map the account to an EMS user.
- [ ] **2.3 — Unified identity resolution**
  - Ensure Google SSO and email/password resolve to the same employee identity where both are enabled.
  - Define account-linking and duplicate-account behavior.
- [ ] **2.4 — Session lifecycle**
  - Sign out, expiration, and unauthorized-session handling.
  - Protect authenticated routes and APIs.
- [ ] **2.5 — Account invitation state integration**
  - Support users whose accounts exist but who have not yet accepted an invitation, according to the onboarding flow.

### Acceptance criteria

- Both required authentication methods work.
- One person cannot accidentally acquire two unrelated employee identities through different sign-in methods.
- Unauthenticated users cannot access protected pages or APIs.
- Authentication failures do not expose secrets or raw technical errors.

---

## EPIC 3 — Fixed roles, authorization, and sensitive-data protection

**Priority:** P0  
**Goal:** Enforce role-aware access consistently on the server and in the UI.

### Tasks

- [ ] **3.1 — Implement the three fixed roles**
  - Employee, Manager, HR Admin.
  - Do not implement custom roles in Phase 1.
- [ ] **3.2 — Implement module-level authorization**
  - Apply access rules to API endpoints and frontend navigation.
  - Never rely on hiding a UI control as the only access control.
- [ ] **3.3 — Implement context-aware Manager access**
  - Manager can access their own Employee features.
  - Manager team access is limited to direct reports and authorized team workflows.
- [ ] **3.4 — Restrict sensitive profile areas**
  - Financials: employee's own data and HR Admin only.
  - Documents: employee's own data and HR Admin only.
  - Managers must not access these areas through URLs, APIs, exports, or indirect requests.
- [ ] **3.5 — Enforce record-level scope**
  - Employee: own records, plus permitted directory/colleague drawer information.
  - Manager: direct-report/team records as specified.
  - HR Admin: organization-wide access where authorized.
- [ ] **3.6 — Add authorization regression tests**
  - Test every role against every protected module and sensitive record type.

### Acceptance criteria

- Employee, Manager, and HR Admin see the correct navigation and data.
- A Manager can still use their own profile, leave/WFH, attendance, and timesheet.
- Managers cannot retrieve Financials or Documents, even by calling APIs directly.
- Exports and dashboards respect the same authorization rules as detail pages.

---

## EPIC 4 — Shared platform services and cross-cutting rules

**Priority:** P0  
**Goal:** Apply consistent behavior across all modules.

### Tasks

- [ ] **4.1 — Shared validation and error handling**
  - Validate requests on the backend.
  - Return human-readable errors.
  - Do not expose raw database, stack trace, or internal API errors to end users.
- [ ] **4.2 — Status conventions**
  - Define valid states and allowed transitions for each workflow.
  - Use consistent, human-readable status labels.
  - Make pending, approved, rejected, expired, and completed states unambiguous where applicable.
- [ ] **4.3 — Date/time conventions**
  - Define storage and display conventions.
  - Handle timezone-aware scheduled invitations and date boundaries consistently.
  - Reuse date validation rules across Leave, WFH, Attendance, Calendar, and onboarding.
- [ ] **4.4 — Audit trail**
  - Record important administrative changes, including who changed what and when.
  - Include employment changes and key policy/configuration changes.
- [ ] **4.5 — Notification delivery foundation**
  - Provide a reusable notification/email mechanism.
  - Support scheduled jobs for invitations and batched notifications where required.
  - Make failures observable and safely retryable.
- [ ] **4.6 — Export foundation**
  - Exports must preserve active filters and enforce the current user's permissions.
- [ ] **4.7 — Shared UI patterns**
  - Loading, empty, error, confirmation, form validation, pagination, and status display.

### Acceptance criteria

- The same date and status concepts behave consistently across modules.
- Important administrative changes are traceable.
- Users receive understandable errors and empty states.
- Exports cannot bypass authorization.

---

## EPIC 5 — Organization settings and configurable reference data

**Priority:** P1  
**Goal:** Let HR maintain organizational data and policies without engineering changes for routine configuration.

### Tasks

- [ ] **5.1 — Company/organization settings**
  - HR Admin-only settings area.
  - Implement only settings specified by the full requirements; details not present in the supplied excerpt need confirmation.
- [ ] **5.2 — Employment reference data**
  - Manage values used by employee employment details: designation, job family, career level, department, manager, location, employment type, and employment status.
- [ ] **5.3 — Employee field configuration**
  - Configure who fills each additional profile field: HR or employee during onboarding.
  - Configure whether each field is required.
- [ ] **5.4 — Leave policy settings**
  - Build configurable leave policies before implementing leave-balance calculations.
  - Confirm entitlement, accrual, balance, and validation rules from the detailed policy requirements.
- [ ] **5.5 — Attendance settings**
  - Implement the settings explicitly defined in the full Attendance requirements.
  - Detailed settings are not present in the supplied excerpt and must be obtained before completion.
- [ ] **5.6 — Holiday calendar configuration**
  - Provide the company holiday data used by calendar and related workflows.
- [ ] **5.7 — Roles & Permissions screen**
  - Administer the three fixed roles/access model.
  - Do not expand this into custom roles or per-action permissions in Phase 1.

### Acceptance criteria

- HR-only settings are inaccessible to Employees and Managers.
- Configured reference values appear in the relevant forms.
- Policy changes are validated and auditable.
- Leave and attendance behavior does not depend on hardcoded business rules where the BRD requires HR configuration.

---

## EPIC 6 — Employee creation, invitations, and onboarding lifecycle

**Priority:** P1  
**Goal:** Create a New Hire and guide them through the three specified onboarding steps.

### Tasks

- [ ] **6.1 — HR Add Employee form**
  - Required fields: Full Name, Company Email, Designation, Role, Start Date.
  - Generate Employee ID automatically; do not ask HR to type it.
  - Do not add Department, Branch, or other fields to the initial form unless Product changes the specification.
- [ ] **6.2 — Employee ID generation**
  - Format: `YYYYMMDD` + two-digit daily sequence.
  - Example: `2026092301`.
  - Read-only after generation.
  - Enforce uniqueness safely if multiple employees are created concurrently on the same date.
- [ ] **6.3 — Create account without invitation**
  - Create the account immediately.
  - Do not send an email.
  - Allow HR to send an invitation later.
- [ ] **6.4 — Send invitation now**
  - Send the invitation email and track its status.
- [ ] **6.5 — Schedule invitation**
  - HR selects a future date and time.
  - Prevent past date/time selection and validate again on the server.
  - Queue and send automatically at the scheduled time.
  - Support cancel and reschedule.
- [ ] **6.6 — Invitation status and actions**
  - Statuses: Scheduled, Sent, Opened, Accepted, Expired, No Invite Sent.
  - Actions: Cancel scheduled invitation, Reschedule invitation, Send invitation, Resend invitation.
  - Expose Resend Invite from the Employees list as well.
- [ ] **6.7 — New Hire lifecycle**
  - Account creation sets status to `New Hire`, regardless of invitation choice.
  - Keep `New Hire` until all onboarding steps are complete.
  - Implement subsequent lifecycle transitions only according to confirmed rules.
- [ ] **6.8 — Onboarding Step 1: Welcome Documents & Introduction**
  - Display introduction video, documents, and the employee's assigned “Your Details” fields.
  - Documents can be required or optional.
  - Required documents/fields must be complete before the step can be marked complete.
- [ ] **6.9 — Onboarding Step 2: Security & Compliance**
  - Display training material and a short exam.
  - Question types: multiple choice and True/False.
  - Calculate pass/fail; support retries.
  - HR configures questions, correct answers, passing threshold, and retry limit.
  - Inform HR about exam attempts using collective/batched notifications, not one notification per attempt.
- [ ] **6.10 — Onboarding Step 3: MFA & Acknowledgements**
  - Support MFA configuration where required.
  - Show acknowledgement statements.
  - Require the employee to actively acknowledge/sign required items.
  - **Needs requirements detail:** the supplied document ends during this step; confirm signature evidence, MFA provider, completion rules, and any failure/recovery behavior.
- [ ] **6.11 — Onboarding progress**
  - Show the three steps and their completion state.
  - Prevent completion when required tasks remain outstanding.
  - Update employee status only when the defined completion conditions are met.

### Acceptance criteria

- All invitation options create the same employee identity and begin with `New Hire`.
- Scheduled invitations cannot be set in the past and are sent at the selected future time.
- Required onboarding tasks cannot be skipped to mark a step complete.
- Exam scoring, retry limits, and batched HR notifications follow configured rules.
- Onboarding and invitation states are visible to authorized users and are auditable.

---

## EPIC 7 — Employee profile and employment history

**Priority:** P1  
**Goal:** Provide one employee record connecting personal details, employment, documents, financial information, and employee activity.

### Tasks

- [ ] **7.1 — Profile shell and tabs**
  - Overview, Personal Information, Employment Details, Financials, Documents, Attendance, Leave & WFH, My Journey / Employment History.
  - Apply the role restrictions from Epic 3 to each tab and its API.
- [ ] **7.2 — Overview**
  - Show Department, Designation, Manager, Direct Reports, Tenure, Work Location, and Attendance summary.
- [ ] **7.3 — Personal Information**
  - Use configured fields and ownership rules.
  - Allow employees to edit fields designated employee-owned, according to configured requirements.
- [ ] **7.4 — Employment Details**
  - Fields: Designation, Job Family, Career Level, Department, Manager, Location, Employment Type, Joining Date, Employment Status.
  - HR edits employment details using configured dropdown values and a date selector for Joining Date.
- [ ] **7.5 — Record as Employment Change**
  - When HR edits Employment Details, provide a `Record as Employment Change` option.
  - If selected, create an employment-history event.
  - If not selected, update/correct the current record without creating a Journey event.
- [ ] **7.6 — Employment change fields**
  - Change Type: Promotion, Role Change, Department Transfer, Career Level Change, Manager Change, Location Change, Employment Type Change, Employment Status Change, Rehire, Administrative Correction, Other.
  - Effective Date is mandatory.
  - Reason for Change and Internal HR Notes are text fields.
- [ ] **7.7 — Employment history / My Journey**
  - Use the same underlying employment-history dataset.
  - Employee view: simplified, read-only, employee-facing My Journey.
  - HR view: detailed, editable Employment History.
  - Display current employment and historical changes, newest first.
  - Show a Current badge beside the current designation.
  - Support pagination or View Full History for large histories.
- [ ] **7.8 — Profile activity summaries**
  - Show relevant Attendance and Leave/WFH summaries while keeping the detailed modules as the primary management views.
- [ ] **7.9 — Financials and Documents**
  - Employee: own records only.
  - HR Admin: full access.
  - Manager: no access.

### Acceptance criteria

- Current employment and historical employment events are distinguishable.
- HR can correct a record without creating an event, or explicitly record a change event.
- Employee My Journey is read-only and does not expose HR-only notes.
- Financials/Documents restrictions are enforced in both UI and API.

---

## EPIC 8 — Employees directory and employee administration

**Priority:** P1  
**Goal:** Provide one searchable employee roster and HR management entry point.

### Tasks

- [ ] **8.1 — Directory table**
  - Default columns: SN, Name, Designation, Department, Manager, Location, Joining Date, Status, Action.
  - Do not display Company/Entity as an extra nested value beneath the employee name.
- [ ] **8.2 — Search, sort, and filter**
  - Support search, sorting, filtering, and pagination where required.
- [ ] **8.3 — Column selection and export**
  - Allow users to select columns.
  - Export must reflect current filters and permissions.
- [ ] **8.4 — Employee indicators**
  - Birthday, Anniversary, WFH, and Leave indicators.
  - Respect visibility permissions.
- [ ] **8.5 — Role-specific employee access**
  - HR Admin: open full profile, view/edit where authorized, use Actions.
  - Manager: open a limited employee slide drawer and view permitted Employment Details; no unrestricted full profile.
  - Employee: view own full profile, permitted colleague directory data, and colleague slide drawer; no colleague full profile.
- [ ] **8.6 — Contextual Actions menu**
  - Include only actions appropriate to the employee's current state.
  - Include View Profile, Edit Profile, Resend Invite, and other approved HR actions.
- [ ] **8.7 — Add Employee entry point**
  - Connect Employees → Add Employee to the onboarding workflow.

### Acceptance criteria

- Directory behavior works with realistic employee volumes.
- Each role sees only the permitted profile detail and actions.
- Export respects selected filters and authorization.
- Indicators do not reveal information beyond the viewer's permissions.

---

## EPIC 9 — Leave and WFH management, policies, and approvals

**Priority:** P1  
**Goal:** Let employees submit requests, managers handle team approvals, and HR administer organization-wide requests and policies.

### Tasks

- [ ] **9.1 — Leave policy and balance foundation**
  - Implement configurable leave rules from the approved policy specification.
  - Validate balances and prevent negative or otherwise invalid balances.
  - Do not infer accrual/carry-forward/expiry rules that are not specified.
- [ ] **9.2 — Employee Leave request**
  - Create, view, and track the employee's own requests.
  - Validate dates and policy constraints.
  - Display clear statuses and approval progress.
- [ ] **9.3 — Employee WFH request**
  - Create, view, and track the employee's own WFH requests.
  - Validate dates and prevent ambiguous/invalid request states.
- [ ] **9.4 — Manager approvals**
  - Show relevant requests from direct reports and requests where the manager is an approver.
  - Support the approved decision actions and record the decision, actor, and time.
- [ ] **9.5 — HR request management**
  - Provide organization-wide request visibility and authorized administrative actions.
  - Make overrides traceable.
- [ ] **9.6 — Approval progress**
  - Show employee, request type, dates, status, approvers, and approval progress.
- [ ] **9.7 — Leave/WFH summaries**
  - Provide data for profile tabs, directory indicators, calendar, and dashboards.
- [ ] **9.8 — Edge cases and data integrity**
  - Test duplicate submissions, overlapping dates, invalid date ranges, concurrent decisions, and policy changes affecting existing requests.

### Acceptance criteria

- Employees can manage only their own requests.
- Managers can act only on authorized team/assigned approvals.
- HR can see organization-wide requests.
- Leave balances never become negative through invalid or concurrent operations.
- Request status and approval progress remain clear and consistent.

---

## EPIC 10 — Attendance and holiday calendar

**Priority:** P1  
**Goal:** Provide reliable attendance records and attendance visibility.

### Tasks

- [ ] **10.1 — Attendance data model and API**
  - Define attendance records and valid states from the detailed Attendance requirements.
- [ ] **10.2 — Employee attendance view**
  - Show the employee's own attendance and history.
- [ ] **10.3 — Manager attendance visibility**
  - Show permitted attendance information for the Manager's team.
- [ ] **10.4 — HR attendance visibility**
  - Provide organization-wide attendance visibility.
- [ ] **10.5 — Attendance summary**
  - Support average check-in and average check-out on the Employee Dashboard.
  - Support attendance summary in the employee profile.
- [ ] **10.6 — Holiday calendar**
  - Use configured public/company holidays consistently in calendar and relevant date-aware workflows.
- [ ] **10.7 — Biometric integration preparation**
  - Define mapping between source/device records and EMS attendance records.
  - Ensure repeat imports do not create duplicate attendance events.

### Acceptance criteria

- Employee, Manager, and HR see the correct scope of attendance data.
- Check-in/check-out summaries use a consistent, documented calculation.
- Holiday dates are consistent across the application.
- Imported biometric data can be reconciled and duplicate imports are safe.

---

## EPIC 11 — Timesheet, productivity, and Jira integration

**Priority:** P1/P2 (confirm launch dependency)  
**Goal:** Display time logged against expected hours, using Jira worklogs as the specified time-data source.

### Tasks

- [ ] **11.1 — Confirm expected-hours source**
  - The requirements identify Expected Hours, Logged Hours, and Productivity but the supplied excerpt does not fully define how expected hours are calculated.
- [ ] **11.2 — Jira integration**
  - Establish authentication/credentials, employee-to-Jira identity mapping, worklog retrieval, sync frequency, and failure handling.
- [ ] **11.3 — Worklog data model**
  - Store or cache synchronized worklog data with source identifiers and sync timestamps.
  - Make synchronization idempotent to avoid double counting.
- [ ] **11.4 — Employee timesheet**
  - Show the employee's own time logs and productivity summary.
- [ ] **11.5 — Manager timesheet**
  - Show authorized team time logs and team productivity.
- [ ] **11.6 — HR timesheet**
  - Show organization/department-level time summary.
- [ ] **11.7 — Productivity calculation**
  - Display Logged Hours against Expected Hours and calculate productivity using the confirmed business formula.
  - Do not use Attendance as a substitute for Jira worklogs.
- [ ] **11.8 — Integration monitoring**
  - Expose last successful sync and actionable failure status to authorized administrators.

### Acceptance criteria

- Worklog totals do not double-count repeated syncs.
- Employee, Manager, and HR scopes are enforced.
- The time summary uses Jira worklogs, not attendance records.
- Productivity uses an approved formula and clearly handles missing data.

---

## EPIC 12 — Calendar and workforce events

**Priority:** P1/P2  
**Goal:** Give users a consistent view of holidays and relevant workforce activity.

### Tasks

- [ ] **12.1 — Calendar baseline**
  - Provide a calendar accessible to Employee, Manager, and HR Admin.
- [ ] **12.2 — Populate calendar**
  - Include configured public holidays and company events.
  - Include Leave/WFH information only within the viewer's permitted scope.
- [ ] **12.3 — Date consistency**
  - Use the shared date/time rules from Epic 4.
- [ ] **12.4 — Upcoming events**
  - Provide upcoming Leave/WFH data for dashboards where the role is authorized.

### Acceptance criteria

- Calendar is available to all three roles.
- Event visibility respects role and record-level permissions.
- Dates agree with the source module and configured timezone/date conventions.

---

## EPIC 13 — Role-specific dashboards

**Priority:** P1/P2  
**Goal:** Give each role an accurate landing page based on the underlying module data.

### Tasks

- [ ] **13.1 — Shared dashboard shell**
  - Greeting, user name, current date, and relevant office/location context.
- [ ] **13.2 — HR Dashboard: organization-wide cards**
  - Headcount: active employees.
  - On Leave Today: employees on approved Leave today.
  - WFH Today: employees working remotely today.
  - Pending Approvals: relevant pending Leave/WFH approvals across the organization.
- [ ] **13.3 — HR Dashboard: request visibility**
  - Show employee, request type, dates, status, approvers, and approval progress.
- [ ] **13.4 — HR Dashboard: workforce panels**
  - Today's Leave and WFH.
  - Upcoming Leave and WFH.
  - Birthdays and work anniversaries.
  - Public holidays and company events.
- [ ] **13.5 — HR Dashboard: time summary**
  - Organization/department Expected Hours, Logged Hours, and Productivity from Jira worklogs.
- [ ] **13.6 — Manager Dashboard**
  - Team-scoped Headcount, On Leave Today, WFH Today, Pending Approvals.
  - Include requests submitted by the Manager's team and requests where the Manager is an approver.
  - Team Expected Hours, Team Logged Hours, and Team Productivity.
- [ ] **13.7 — Employee Dashboard**
  - Productivity: Logged against Expected.
  - Attendance: Average Check-In and Average Check-Out.
  - My Leave/WFH: WFH taken this year and paid Leave taken this year.
  - My Score: show a performance rating only if a valid existing/source system provides it; do not build a Phase 1 performance engine.
- [ ] **13.8 — Dashboard empty/error states**
  - Explain missing data clearly rather than showing misleading zero values or raw errors.
- [ ] **13.9 — Dashboard authorization and performance**
  - Validate every aggregate against the user's scope.
  - Avoid loading organization-wide details for users who are only allowed team/own data.

### Acceptance criteria

- Each role lands on the correct dashboard.
- HR sees organization-wide data, Manager sees team data, and Employee sees self-focused data.
- Dashboard figures reconcile with the source modules.
- Missing or unavailable data is not represented as a misleading business value.

---

## EPIC 14 — Announcements and notifications

**Priority:** P2  
**Goal:** Give users access to relevant announcements and workflow notifications.

### Tasks

- [ ] **14.1 — Announcement viewing**
  - Employee and Manager can view announcements.
- [ ] **14.2 — Announcement management**
  - HR Admin can manage announcements.
- [ ] **14.3 — Notification center**
  - Provide a role-aware notifications area and read/unread state if specified by the detailed requirements.
- [ ] **14.4 — Workflow notifications**
  - Connect invitations, approvals, onboarding events, and exam-attempt summaries.
- [ ] **14.5 — Batched exam notifications**
  - Batch/collect exam-attempt notifications to HR rather than sending one for every attempt.
- [ ] **14.6 — Delivery resilience**
  - Track delivery failures and safely retry where appropriate.

### Acceptance criteria

- HR-only management actions are protected.
- Users receive only notifications they are authorized to see.
- Batched exam notifications avoid notification spam.
- Delivery failures are diagnosable without exposing technical details to users.

---

## EPIC 15 — Biometric integration

**Priority:** P2  
**Goal:** Bring biometric attendance data into EMS once the source contract is confirmed.

### Tasks

- [ ] **15.1 — Confirm vendor/device contract**
  - API/file format, credentials, identifiers, polling/webhook method, and source timezone.
- [ ] **15.2 — Map identities**
  - Map biometric identities to EMS employees; define handling for unmatched records.
- [ ] **15.3 — Import attendance**
  - Validate timestamps and source records.
  - Make imports idempotent and safe to retry.
- [ ] **15.4 — Reconciliation and failures**
  - Report failed/unmatched imports to authorized administrators.
  - Provide a safe reprocessing path.

### Acceptance criteria

- Duplicate source records do not duplicate attendance.
- Invalid or unmatched records are visible for reconciliation.
- Imported data uses the same date/time conventions as EMS.

---

## EPIC 16 — Data migration and reconciliation

**Priority:** P0 for launch  
**Goal:** Move required existing data into EMS without losing integrity or exposing restricted information.

### Tasks

- [ ] **16.1 — Inventory existing sources**
  - Employees, profile fields, employment details/history, leave balances/requests, WFH, attendance, timesheets/worklogs, documents, and onboarding state as applicable.
- [ ] **16.2 — Map source-to-target fields**
  - Document transformations, defaults, identifier mapping, and ownership of each field.
- [ ] **16.3 — Build repeatable migration scripts**
  - Support dry runs, logging, validation, and safe retry/re-run behavior.
- [ ] **16.4 — Reconcile data**
  - Compare record counts, employee identities, leave balances, request statuses, attendance, and worklog totals against source systems.
- [ ] **16.5 — Handle invalid legacy records**
  - Identify malformed values and negative/invalid balances.
  - Do not silently import invalid data; agree on correction rules with Product/HR.
- [ ] **16.6 — Cutover plan**
  - Define freeze window, final sync, rollback, and sign-off.
- [ ] **16.7 — Mobile replacement readiness**
  - Verify the required employee capabilities available in the current mobile experience are available in the web app before retiring mobile.

### Acceptance criteria

- Migration can be run in a test environment and reconciled before production.
- Data issues are reported and resolved or explicitly accepted by HR/Product.
- Cutover and rollback steps are documented and rehearsed.
- HR signs off on migrated employee and HR data.

---

## EPIC 17 — End-to-end hardening and launch readiness

**Priority:** P0 for launch  
**Goal:** Verify the whole application as a secure, reliable replacement.

### Tasks

- [ ] **17.1 — Role-based end-to-end test suite**
  - Employee, Manager, and HR Admin workflows.
  - Manager-as-Employee scenarios.
  - Attempts to access unauthorized employee records, Financials, Documents, exports, and APIs.
- [ ] **17.2 — Workflow integration tests**
  - Employee creation → invitation → onboarding → status transition.
  - Employment edit → optional history event.
  - Leave/WFH request → approval → dashboard/calendar visibility.
  - Jira sync → timesheet → productivity dashboard.
  - Biometric sync → attendance views.
- [ ] **17.3 — Data-integrity tests**
  - Invalid dates, duplicate requests, concurrent actions, negative balances, missing values, invalid statuses, and repeated integrations.
- [ ] **17.4 — UI quality**
  - Responsive layouts, loading/empty/error states, clear validation, and human-readable statuses.
- [ ] **17.5 — Security review**
  - Authentication/session handling, authorization, sensitive data, secrets, audit logging, and export paths.
- [ ] **17.6 — Operational readiness**
  - Logging, monitoring, backups, restore test, alerting, migration runbook, and support process.
- [ ] **17.7 — User acceptance testing**
  - HR validates administration workflows.
  - Managers validate team workflows.
  - Employees validate self-service and onboarding.
- [ ] **17.8 — Launch sign-off**
  - Confirm all required Phase 1 features are complete.
  - Confirm no P0/P1 defects remain open.
  - Obtain Product/HR approval before retiring the old employee experience.

### Acceptance criteria

- Critical user journeys pass end to end.
- No known role-based access issue exposes restricted employee data.
- Data reconciliation is signed off.
- Rollback and incident response plans are available.

---

# 5. Suggested sprint planning slices

Use these as planning batches; split or combine based on team capacity.

## Slice A — Secure foundation
- [ ] Epic 0: decisions and architecture
- [ ] Epic 1: app/data foundation
- [ ] Epic 2: authentication
- [ ] Epic 3: roles and access
- [ ] Epic 4: shared validation, status/date conventions, audit, errors

**Demo:** users can sign in through the supported method(s), and APIs enforce the three roles.

## Slice B — HR can create and onboard an employee
- [ ] Epic 5: reference data and field configuration baseline
- [ ] Epic 6: Add Employee, ID, invitation choices/status, onboarding steps

**Demo:** HR creates a New Hire, sends or schedules an invitation, and the employee can complete the available onboarding steps.

## Slice C — Employee record and directory
- [ ] Epic 7: profile and employment history
- [ ] Epic 8: directory and employee actions

**Demo:** HR manages an employee record; employee sees My Journey; Manager sees only permitted colleague details.

## Slice D — Leave/WFH workflows
- [ ] Epic 9: policy, request, approval, balance integrity

**Demo:** employee submits a request, manager approves/rejects within their scope, and HR can see organization-wide request status.

## Slice E — Attendance, calendar, and time
- [ ] Epic 10: attendance and holiday calendar
- [ ] Epic 11: Jira timesheet/productivity
- [ ] Epic 12: calendar

**Demo:** role-scoped attendance and worklog information is visible and date-consistent.

## Slice F — Dashboards and communications
- [ ] Epic 13: dashboards
- [ ] Epic 14: announcements and notifications

**Demo:** all three roles see accurate, role-appropriate dashboard metrics and workflow notifications.

## Slice G — Integrations and launch
- [ ] Epic 15: biometric integration
- [ ] Epic 16: migration and reconciliation
- [ ] Epic 17: end-to-end hardening and launch readiness

**Demo:** migrated data reconciles, integrations are stable, UAT passes, and the web replacement is ready for sign-off.

---

# 6. Core acceptance checklist across every feature

Before marking any feature Done, verify:

- [ ] Backend validation exists; frontend validation is not the only protection.
- [ ] Employee, Manager, and HR Admin permissions are tested.
- [ ] Manager access is scoped to direct reports/authorized approvals and does not replace their own Employee access.
- [ ] Financials and Documents remain inaccessible to Managers through all routes and APIs.
- [ ] Dates and timezones follow the shared convention.
- [ ] Statuses are consistent and understandable.
- [ ] Empty, loading, and error states are implemented.
- [ ] Raw technical/database errors are not exposed to end users.
- [ ] Important administrative changes are auditable.
- [ ] Export, if present, respects active filters and permissions.
- [ ] Invalid balances, malformed values, duplicate imports, and ambiguous approval states are covered by tests.
- [ ] Documentation and relevant automated tests are updated.

---

# 7. Key data-integrity rules to implement early

1. **Employee ID uniqueness:** generated IDs must remain unique even when multiple employees are created on the same date.
2. **Identity unification:** Google SSO and email/password must resolve to the same employee identity.
3. **Role-aware records:** the server must enforce record scope, not only the frontend.
4. **Sensitive information:** Managers must never access employee Financials or Documents.
5. **Leave balances:** prevent invalid/negative balances through validation and safe transactional updates.
6. **Workflow status:** define legal state transitions for invitation, onboarding, Leave/WFH approval, and employment lifecycle.
7. **Date consistency:** use one documented convention for dates, times, timezone, and scheduled tasks.
8. **Idempotent integrations:** repeated Jira/biometric syncs must not double-count or duplicate records.
9. **Auditability:** important HR changes and administrative overrides must record actor and timestamp.
10. **Permission-aware export:** data exported must be limited to the user's allowed scope and active filters.

---

# 8. Dependencies and implementation notes

- **Leave balances depend on Leave Policy Settings.** Do not implement balance calculations before the policy rules are confirmed.
- **Dashboards depend on source modules.** Avoid building dashboard metrics from placeholder data that later becomes the production calculation.
- **Productivity depends on Jira worklogs.** The requirements explicitly state that time data comes from Jira rather than Attendance.
- **Employee lifecycle depends on onboarding completion rules.** New Hire remains until all three onboarding steps are complete.
- **Employment history depends on the edit decision.** An HR edit creates a history event only when `Record as Employment Change` is selected.
- **Sensitive-data security must be built with the data model/API.** Do not defer it until UI completion.
- **Migration depends on stable target schemas and agreed transformation rules.**
- **Biometric integration depends on vendor/source details**, which are not in the supplied excerpt.

---

# 9. Product decisions / missing details to resolve

These are not assumptions to silently implement. Assign an owner and confirm the expected behavior.

| ID | Decision / missing detail | Why it matters |
|---|---|---|
| D-01 | Is `Pre-Hire` a separate state, or should created accounts always start as `New Hire`? | Employee lifecycle and filters |
| D-02 | Exact transition criteria and timing for New Hire → Probation → Active → Resigned/Inactive | Employee status correctness |
| D-03 | Complete Leave Policy rules: entitlement, accrual, balance calculation, partial days, overlaps, and any exceptions | Correct balances and requests |
| D-04 | Which leave types/policy options are required now versus explicitly deferred | Scope control |
| D-05 | Detailed Attendance rules and configurable settings | Attendance calculation and UI |
| D-06 | Expected-hours source and the approved Productivity formula | Timesheet/dashboard accuracy |
| D-07 | Jira authentication, identity mapping, sync frequency, historical range, and failure behavior | Timesheet integration |
| D-08 | Biometric provider/device/API and identity/timestamp mapping | Attendance integration |
| D-09 | MFA provider, whether MFA is mandatory for all or selected users, and recovery behavior | Onboarding Step 3 |
| D-10 | Acknowledgement/signature evidence, retention, and completion rules | Onboarding Step 3 auditability |
| D-11 | Email provider and invitation expiration/acceptance behavior | Invitation delivery lifecycle |
| D-12 | Exact company settings and notification-center behavior beyond the supplied excerpt | Avoid guessed features |
| D-13 | Source systems, field mapping, data correction ownership, and cutover plan | Safe migration |
| D-14 | Where the Employee Dashboard `My Score` value comes from, if any | Avoid implying Phase 1 Performance Management |
| D-15 | Required parity checklist for the existing mobile employee experience | Mobile retirement sign-off |

---

# 10. Explicit Phase 1 scope boundaries

## In scope per the requirements

- [ ] Authentication
- [ ] Role-based access
- [ ] Dashboard
- [ ] Employees
- [ ] Employee Profile
- [ ] Employment Details
- [ ] My Journey / Employment History
- [ ] Leave Management
- [ ] WFH Management
- [ ] Approval Management
- [ ] Attendance
- [ ] Calendar
- [ ] Timesheet / Productivity
- [ ] Employee Onboarding
- [ ] Company/Organization Settings
- [ ] Leave Policy Settings
- [ ] Attendance Settings
- [ ] Holiday Calendar
- [ ] Roles & Permissions
- [ ] Announcements
- [ ] Notifications
- [ ] Jira integration
- [ ] Biometric integration
- [ ] Data migration

## Out of scope for Phase 1

Do not build these as Phase 1 modules:

- Payroll
- Overtime
- Reimbursement
- Performance Management
- Reports
- Organization Chart
- Standalone Learning & Development
- Standalone Training Library
- Advanced Performance/KPI management
- Advanced compensation management

**Important:** Security & Compliance training and its exam remain part of New Hire onboarding. This does not make standalone Learning & Development a Phase 1 module.

## Deferred features — do not expand Phase 1 without approval

- Attendance regularization
- Compensatory Leave
- Advanced carry-forward rules
- Leave expiry rules
- Per-leave-type approval routing
- Custom roles
- Advanced reporting
- Full Performance Management
- Payroll
- Overtime

---

# 11. Definition of Ready and Definition of Done

## Definition of Ready

A backlog item is ready for development when:

- [ ] The user/role and business outcome are clear.
- [ ] Acceptance criteria are written.
- [ ] Required fields, statuses, and validation rules are known.
- [ ] Permission rules are identified.
- [ ] Dependencies and external integrations are known.
- [ ] UI design or an agreed interaction description is available.
- [ ] Open Product decisions are resolved or explicitly excluded from the item.

## Definition of Done

A backlog item is done when:

- [ ] Implementation is complete across UI, API, and persistence as applicable.
- [ ] Authorization and validation are enforced server-side.
- [ ] Unit/integration tests cover the main flow and relevant edge cases.
- [ ] Relevant role-based access tests pass.
- [ ] Errors, loading, and empty states are handled.
- [ ] Audit logging is included where required.
- [ ] Documentation and API contracts are updated.
- [ ] Code review is complete and deployment/migration steps are safe.
- [ ] Acceptance criteria are demonstrated to the relevant stakeholder.

---

# 12. Lead Engineer weekly review checklist

At each planning/review meeting, check:

- [ ] Are we building in dependency order?
- [ ] Did any feature introduce a new role or permission rule that is not in the BRD?
- [ ] Are leave balances and workflow transitions protected against invalid data?
- [ ] Are all dates and timezones consistent?
- [ ] Do dashboards reconcile with source data?
- [ ] Are Jira and biometric syncs idempotent and observable?
- [ ] Are Financials/Documents protected from Managers at API level?
- [ ] Are unresolved Product decisions assigned and tracked?
- [ ] Are we accidentally pulling an out-of-scope/deferred feature into Phase 1?
- [ ] Is the old mobile experience still required until web parity and sign-off are complete?

---

# 13. Recommended first engineering tasks

Start with these, in this order:

1. [ ] Create the decision log and resolve D-01, D-03, D-05, D-06, D-09, D-13, and D-15.
2. [ ] Draw the architecture and initial ERD.
3. [ ] Establish migrations, environment configuration, API error conventions, and automated test setup.
4. [ ] Implement identity and the two authentication methods.
5. [ ] Implement fixed-role authorization and test sensitive-data restrictions.
6. [ ] Build organization reference data and employee field configuration.
7. [ ] Implement Add Employee, unique Employee ID generation, and invitation state management.
8. [ ] Implement onboarding progress and Step 1, then Step 2, then Step 3 once its missing details are confirmed.
9. [ ] Build Employee Profile and Employment History, then the role-aware directory.
10. [ ] Implement Leave Policy before Leave/WFH request and approval workflows.
11. [ ] Build Attendance/Calendar and Jira worklog synchronization.
12. [ ] Build dashboards from validated source modules.
13. [ ] Complete notifications, biometric integration, migration, UAT, and launch hardening.

---

## 14. Release gate

Do **not** retire the existing mobile employee experience until all of the following are true:

- [ ] Required employee functionality is available on the web.
- [ ] Employee, Manager, and HR Admin workflows have passed UAT.
- [ ] Sensitive information is protected and access tests pass.
- [ ] Migrated data is reconciled and signed off.
- [ ] Leave balances, approvals, dates, and statuses have no known integrity defects.
- [ ] Jira/biometric integrations required for launch are working or have an approved launch decision.
- [ ] Monitoring, backups, support ownership, and rollback steps are ready.
- [ ] Product/HR formally approve the web replacement.
