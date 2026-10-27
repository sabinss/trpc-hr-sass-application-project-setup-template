# Novelty EMS — Engineering Design Document

**Document status:** Draft for Engineering and Product Review  
**Version:** 0.1  
**Product:** Novelty EMS  
**Release:** Phase 1  
**Document owner:** Lead Engineer  
**Product owner:** Novelty / Product Management  
**Business stakeholders:** HR / Operations  
**Design owner:** Product / UX  
**Quality owner:** QA  
**Delivery owner:** Project / Engineering Management

---

## 1. Project Summary

### 1.1 Overview

Novelty EMS is a web-based Employee Management System designed to unify employee self-service, workforce administration, approvals, attendance, onboarding and employment lifecycle management.

The current HR experience is fragmented across separate employee and HR experiences. This increases operational overhead, creates unnecessary dependency on HR and contributes to inconsistent data and unclear workflows.

Phase 1 will establish a unified web platform for employees, managers and HR administrators.

Novelty is the initial customer. The product is also intended to become a reusable, multi-tenant SaaS platform that can serve additional organizations in the future.

### 1.2 Product Vision

Provide one simple, reliable and role-aware platform through which:

- Employees manage their own HR activities.
- Managers manage their teams and approvals.
- HR manages the organization's workforce, policies and configuration.
- Future customer organizations can use the same platform with appropriately isolated data and settings.

### 1.3 Why Are We Building This?

The requirements document identifies the following business problems:

1. Fragmented employee experiences.
2. Excessive HR dependency for routine employee activities.
3. Hardcoded leave policies.
4. Limited visibility into leave, WFH, attendance and timesheets.
5. Data integrity issues, including negative leave balances, malformed values and unclear approval states.
6. Limited onboarding and employment-history capabilities.

### 1.4 Why Now?

Phase 1 is intended to replace the existing employee experience with a unified web application and establish a reliable foundation for future HR capabilities.

The replacement must preserve the required existing employee functionality before the legacy mobile experience is retired.

### 1.5 Business Objectives

| ID    | Objective             | Expected outcome                                                   |
| ----- | --------------------- | ------------------------------------------------------------------ |
| BO-01 | Unified HR platform   | One web experience for employees, managers and HR                  |
| BO-02 | Role-based access     | Users see only authorized data and actions                         |
| BO-03 | Employee self-service | Reduced dependency on HR for routine activities                    |
| BO-04 | Configurable policies | HR can configure supported policies without engineering changes    |
| BO-05 | Workforce visibility  | Reliable workforce views for managers and HR                       |
| BO-06 | Employee lifecycle    | Structured onboarding and employment history                       |
| BO-07 | Data integrity        | Correct balances, validated records and clear workflow states      |
| BO-08 | Web replacement       | Required employee functionality available before mobile retirement |

### 1.6 Key References

- Source document: Novelty EMS Master Business & Product Requirements Document, Version 2.0.
- Repository: To be linked.
- UX designs: To be linked.
- Product backlog: To be linked.
- API and technical specifications: To be created after design review.
- Migration mapping: To be created with the legacy system owners.

---

## 2. Requirements and Scope

### 2.1 Phase 1 Functional Scope

#### A. Authentication and access

- Google SSO.
- Email/password authentication.
- Employee, Manager and HR Admin roles.
- Role-aware navigation and data access.
- Module-level permissions.
- Protection of sensitive employee information.

Both authentication methods must resolve to the same employee identity.

#### B. Dashboard

- Employee dashboard.
- Manager dashboard restricted to the manager's team.
- HR dashboard with organization-wide workforce information.
- Headcount, leave, WFH and pending approval summaries.
- Upcoming workforce events and holidays.
- Time summaries based on timesheet data.
- Employee productivity and other dashboard metrics supported by approved data sources.

The source requirements include a “My Score” card but do not establish its source. This remains an open product decision.

#### C. Employee management

- Employee directory with search, sorting and filtering.
- Employee creation and profile management.
- Employment details.
- Departments, locations, job families, career levels and designations.
- Employment changes with effective dates.
- Employment history and My Journey.
- Employee status and lifecycle management.

#### D. Employee onboarding

- New employee creation and invitations.
- Immediate, scheduled or omitted invitations where supported.
- Configurable onboarding templates.
- Profile field completion.
- Onboarding progress and deadlines.
- Security and compliance training within the onboarding workflow.
- Acknowledgements, examinations, retries and completion tracking as specified.
- New Hire to Probation transition.

The Probation-to-Active transition requires clarification before lifecycle automation is finalized.

#### E. Leave and WFH

- Leave and WFH request submission.
- Request dates, duration, reason and relevant supporting information.
- Approver and notifier assignment.
- Approval progress and status.
- Multi-approver workflows.
- Rejection, cancellation and approval comments.
- Leave balances and history.
- Leave types, eligibility, entitlement and policy assignment.
- HR administrative overrides.
- Delegated approvals where required by the approved specification.
- Notifications for relevant events.

#### F. Attendance

- Attendance records and summaries.
- Present, absent, WFH, leave, late and early-departure statuses where applicable.
- Shift-aware attendance evaluation.
- Attendance visibility for employees, managers and HR.
- Filters and exports where specified.
- Biometric data synchronization.
- Working hours, shifts and attendance configuration.

Attendance regularization is deferred from Phase 1.

#### G. Calendar

- Public holidays.
- Company events.
- Approved leave and WFH.
- Birthdays and work anniversaries.
- Relevant filters based on role and authorized organizational visibility.

#### H. Timesheet and productivity

- Timesheet records from Jira.
- Bulk upload where direct Jira access is unavailable.
- HR-admin manual corrections.
- Expected hours, logged hours and productivity.
- Date-range, project and permitted employee filters.
- Totals in timesheet views.

The precise productivity calculation and treatment of values above 100% must be confirmed.

#### I. Organization settings

- Company information.
- Locations and departments.
- Job families, career levels and designations.
- Employment management configuration.
- Working hours and shifts.
- Holiday calendar.
- Leave policies and leave types.
- Module-level permissions.
- Integration settings.
- Onboarding templates.

#### J. Announcements and notifications

- HR-created announcements.
- Audience selection and publication.
- In-app notifications.
- Email notifications.
- Leave/WFH, onboarding, employment and announcement events.

#### K. Integrations and migration

- Google SSO.
- Jira worklog synchronization.
- Biometric attendance integration.
- Employee records migration.
- Leave balance migration.
- Historical leave and WFH request migration.
- Validation and reconciliation of migrated records.

### 2.2 Explicitly Out of Scope

The following are not Phase 1 deliverables:

- Payroll.
- Overtime management.
- Reimbursements.
- Full performance management.
- Advanced performance/KPI engine.
- Advanced compensation management.
- Advanced reporting.
- Organization chart.
- Standalone Learning & Development.
- Standalone training library.
- Attendance regularization.
- Compensatory leave.
- Advanced carry-forward and leave-expiry rules.
- Custom role creation.
- Per-leave-type approval routing beyond the approved Phase 1 behavior.

Security and compliance training required within onboarding remains in scope; it does not imply a separate learning management module.

### 2.3 Non-Functional Requirements

The source requirements establish security, privacy, auditability, reliability, performance and scalability as concerns. Numerical targets and detailed acceptance thresholds must be agreed with Product and stakeholders.

| Area            | Requirement / proposed direction                                                   |
| --------------- | ---------------------------------------------------------------------------------- |
| Security        | Enforce authentication and authorization on protected backend operations           |
| Privacy         | Restrict sensitive employee data according to role and organizational scope        |
| Data integrity  | Validate inputs, enforce business invariants and prevent invalid state transitions |
| Auditability    | Record important administrative changes and employment events                      |
| Reliability     | Handle integration failures and prevent partial or ambiguous business operations   |
| Performance     | Define measurable latency targets for important workflows                          |
| Scalability     | Support growth in employees, records and customer organizations                    |
| Maintainability | Keep feature boundaries clear and testable                                         |
| Usability       | Provide consistent dates, statuses and actionable error messages                   |
| Compatibility   | Support the agreed browser/device requirements and web replacement criteria        |

Performance targets, availability objectives, recovery objectives and retention periods remain open decisions.

---

## 3. Current State and Proposed Architecture

### 3.1 Architecture Goals

The proposed architecture should:

1. Support a unified web experience.
2. Reuse TypeScript contracts across the frontend and backend.
3. Separate business features into maintainable modules.
4. Keep authentication and authorization centralized.
5. enforce organization-level data isolation for the SaaS product.
6. Support configurable HR policies without hardcoding customer-specific behavior.
7. Allow integrations and background synchronization to evolve independently where justified.
8. Avoid introducing unnecessary distributed services in Phase 1.

### 3.2 Proposed Technology Stack

The current project direction is:

| Layer                   | Proposed technology                   | Responsibility                                        |
| ----------------------- | ------------------------------------- | ----------------------------------------------------- |
| Language                | TypeScript                            | Static typing and shared contracts                    |
| Frontend                | React                                 | User interface and reusable components                |
| API communication       | tRPC                                  | Type-safe frontend/backend procedure calls            |
| Server-state management | TanStack Query                        | Fetching, caching, refetching and mutation updates    |
| Runtime                 | Node.js                               | Backend execution                                     |
| Monorepo                | Turborepo + pnpm                      | Workspace management and coordinated build/test tasks |
| Database                | To be confirmed                       | Persistent employee and workforce records             |
| Authentication          | Google SSO + email/password           | Identity verification                                 |
| Integrations            | Jira and biometric provider APIs/feed | External workforce data                               |
| Observability           | To be selected                        | Logs, metrics, traces and alerts                      |

The database, ORM, hosting platform, session strategy, notification provider and queue technology are not finalized in this document.

The existing repository configuration must be inspected before implementation-specific decisions are made.

### 3.3 High-Level Architecture

```text
                         Employees / Managers / HR
                                    |
                                    v
                         React Web Application
                                    |
                       tRPC Client + TanStack Query
                                    |
                                    v
                           Node.js API Application
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
   Authentication &          Feature Modules           Integration Layer
   Authorization             - Employees                - Google SSO
                             - Onboarding               - Jira
                             - Leave / WFH              - Biometric
                             - Attendance
                             - Timesheet
                             - Settings
                             - Notifications
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
                                    v
                              Data Access Layer
                                    |
                                    v
                                  Database
```

This is a logical architecture. The diagram does not prescribe separate deployable services for each box.

### 3.4 Architectural Approach

**Preferred initial approach: modular monolith within a Turborepo monorepo.**

The frontend and backend may be built and deployed independently, while feature modules remain organized within the backend application.

This avoids the operational complexity of microservices while keeping business responsibilities separated.

The team should introduce independent services only when there is a demonstrated need for independent scaling, deployment, ownership or fault isolation.

### 3.5 Proposed Repository Organization

The exact structure must follow the existing repository rather than replace it with a new template.

An illustrative target is:

```text
apps/
  web/
    src/
      features/
        dashboard/
        employees/
        onboarding/
        leave-wfh/
        attendance/
        calendar/
        timesheet/
        settings/
        announcements/
        notifications/

  api/
    src/
      modules/
        auth/
        employees/
        onboarding/
        leave-wfh/
        attendance/
        calendar/
        timesheet/
        settings/
        announcements/
        notifications/
        integrations/
        migration/
      trpc/
        routers/
        context/
        initialization/

packages/
  ui/
  validation/
  permissions/
  config/
  types/
```

These are proposed boundaries, not instructions to duplicate existing packages. The existing tRPC setup, root router composition and shared utilities must be reused where suitable.

---

## 4. Multi-Tenant SaaS Design

### 4.1 Context

Novelty is the first customer, but the product is intended to support multiple organizations.

Each organization will require its own employee records, policies, configuration, requests, attendance and other workforce data.

### 4.2 Proposed Design Principles

- Introduce an organization/tenant concept into the domain model.
- Associate tenant-owned records with the appropriate organization.
- Resolve organization context from an authenticated and authorized request context.
- Enforce organization boundaries in backend services and data-access operations.
- Avoid relying on frontend filtering as a security control.
- Keep platform-level administration separate from organization-level HR administration.
- Make organization-specific policies configurable.
- Include tenant-isolation tests in the security test suite.

### 4.3 Initial Tenant Data Model

A conceptual model is:

```text
Organization
    |
    +---- Employees
    |       |
    |       +---- Employment History
    |       +---- Onboarding
    |       +---- Leave / WFH Requests
    |       +---- Attendance
    |       +---- Timesheets
    |
    +---- Leave Policies
    +---- Holiday Calendars
    +---- Departments and Locations
    +---- Organization Settings
    +---- Announcements
```

This is a domain-level illustration, not a finalized relational schema.

### 4.4 Open Infrastructure Decision

The database isolation strategy is undecided:

- Shared database with organization-scoped records.
- Separate schemas per organization.
- Separate databases for selected or all organizations.

The recommended starting point to evaluate is a shared database with strict tenant-aware access controls, provided this satisfies the agreed isolation and compliance requirements.

The final choice requires a review of security, data volume, migrations, backup/recovery, cost and customer requirements.

---

## 5. Core Domain Design

### 5.1 Initial Domain Entities

The following conceptual entities are expected to be required. Field definitions and relationships remain subject to detailed design.

| Entity                    | Purpose                                                |
| ------------------------- | ------------------------------------------------------ |
| Organization              | Customer organization and tenant boundary              |
| User / Identity           | Authentication identity                                |
| Employee                  | Employee's primary organizational record               |
| Role Assignment           | Employee role and applicable scope                     |
| Department                | Organizational department                              |
| Location                  | Office or organizational location                      |
| Designation               | Job designation and associated job family/career level |
| Employment Record         | Employment attributes and effective dates              |
| Employment Change         | Historical employment change event                     |
| Onboarding Template       | Configurable onboarding workflow                       |
| Onboarding Instance       | Employee-specific onboarding progress                  |
| Leave Policy              | Eligibility, entitlement and policy configuration      |
| Leave Balance / Ledger    | Auditable leave entitlement and consumption            |
| Leave Request             | Employee leave request and status                      |
| WFH Request               | Work-from-home request and status                      |
| Approval Step             | Approver, decision, order and timestamps               |
| Attendance Record         | Daily attendance and associated source data            |
| Shift / Working Schedule  | Expected working schedule                              |
| Holiday                   | Holiday and organizational/location scope              |
| Timesheet Record          | Expected and logged hours                              |
| Announcement              | Published organizational communication                 |
| Notification              | In-app/email notification state                        |
| Audit Event               | Traceable administrative and business changes          |
| Integration Configuration | Provider configuration and synchronization status      |

### 5.2 Identity and Employee Relationship

An authentication identity should map consistently to the employee record regardless of whether the employee uses Google SSO or email/password.

A manager is also an employee. The model must not assume that the Manager role removes the user's Employee capabilities.

Authorization should consider the combination of identity, role, resource ownership, organizational scope and action.

### 5.3 Employment History and My Journey

Normal profile corrections should be distinguished from formal employment changes.

Formal employment changes should support:

- Change type.
- Effective date.
- Reason.
- Internal HR notes where appropriate.
- Previous and new values where required for audit.
- A traceable employment history.
- A consistent My Journey timeline.

The detailed rules for effective dates, retroactive changes and historical correction must be finalized before implementation.

---

## 6. Core Business Workflows

### 6.1 Employee Creation and Onboarding

```text
HR creates employee
        |
        v
Identity and employee record established
        |
        v
Invitation sent / scheduled / omitted
        |
        v
New Hire onboarding
        |
        v
Employee completes required onboarding steps
        |
        v
Completion validation
        |
        v
Probation
```

The final state and subsequent Probation-to-Active transition require product confirmation.

The design must also establish the rules for onboarding existing employees with incomplete profile or onboarding information.

### 6.2 Leave Request and Approval

```text
Employee submits request
        |
        v
Validate dates, duration, policy and eligibility
        |
        v
Create request with Pending status
        |
        v
Approvers process request
        |
        +---- Any required rejection ----> Rejected
        |
        +---- All required approvals ----> Approved
        |
        v
Update relevant balance and calendar views
```

The exact status transitions, balance reservation timing, cancellation rules and transaction boundaries must be defined in the low-level design.

The implementation must not allow concurrent requests or retries to produce inconsistent leave balances.

### 6.3 Attendance Integration

```text
Biometric provider
        |
        v
Integration adapter
        |
        v
Validate, normalize and deduplicate records
        |
        v
Persist attendance records
        |
        v
Evaluate against working schedule and holidays
        |
        v
Employee / Manager / HR views
```

The supported device, ingestion mechanism, synchronization frequency, time zone and duplicate handling are open integration decisions.

### 6.4 Timesheet Integration

```text
Jira worklogs / bulk upload / HR correction
                    |
                    v
             Validate and map
                    |
                    v
           Persist timesheet records
                    |
                    v
          Compare expected and logged hours
                    |
                    v
        Calculate productivity and totals
                    |
                    v
         Role-aware dashboard and reports
```

Jira project mapping, employee mapping, source precedence, synchronization behavior and correction history must be established before production integration.

---

## 7. API and tRPC Design

### 7.1 Principles

- Group procedures by business domain.
- Keep the root router responsible for composition rather than business logic.
- Validate inputs at runtime.
- Apply authorization in the backend, not only in the frontend.
- Keep business rules outside transport-specific procedure handlers.
- Use shared input schemas where they genuinely have multiple consumers.
- Return consistent error shapes without exposing internal implementation details.
- Use transactions for operations that modify related records.
- Make external synchronization and retried operations safe to repeat where possible.

### 7.2 Illustrative Procedure Organization

```text
trpc/
  routers/
    employees.router.ts
    onboarding.router.ts
    leave.router.ts
    wfh.router.ts
    attendance.router.ts
    timesheet.router.ts
    settings.router.ts
    notifications.router.ts
  context.ts
  root-router.ts
```

This layout should be adapted to the existing repository.

Feature-specific services and data access should remain in their relevant domain modules rather than all being placed inside the tRPC directory.

### 7.3 Example: Leave Procedures

Illustrative procedure names:

```text
leave.getMyBalance
leave.listMyRequests
leave.createRequest
leave.cancelRequest
leave.listPendingApprovals
leave.approveRequest
leave.rejectRequest
leave.listPolicies
```

These are proposed names, not approved API contracts.

Each procedure must validate its inputs and enforce the relevant user, organization and resource permissions.

### 7.4 Error Handling

The application should expose understandable error messages for cases such as:

- Invalid dates.
- Missing required fields.
- Insufficient leave balance, according to the approved policy.
- Unauthorized access.
- Request already processed.
- Invalid workflow transition.
- Integration temporarily unavailable.

Raw database errors, stack traces and internal secrets must not be returned to end users.

---

## 8. Data Integrity and Security Design

### 8.1 Data Integrity Controls

The system must address the known failure modes identified in the source requirements.

Proposed controls include:

1. Runtime validation of external and user-supplied data.
2. Database constraints for required fields and valid relationships.
3. Explicit workflow states and permitted transitions.
4. Transactional updates for related records.
5. Safe handling of duplicate submissions and retries.
6. Auditable administrative overrides.
7. Reconciliation after migration and integration synchronization.
8. Consistent date, time zone and status conventions.

### 8.2 Leave Balance Integrity

The detailed balance design should evaluate an auditable ledger or equivalent transactional model rather than relying solely on an editable numeric balance.

The design must define:

- How entitlement is granted.
- When pending requests affect available balance.
- When approved leave is deducted.
- How cancellations and rejections affect balances.
- How unpaid leave is represented.
- How corrections and HR overrides are recorded.
- How concurrent requests are handled.
- How migrated balances are reconciled.

No single balance formula should be implemented until these business rules are confirmed.

### 8.3 Authorization

Phase 1 uses three fixed roles:

- Employee.
- Manager.
- HR Admin.

The permission granularity is module-level, with resource scope and sensitive-field restrictions enforced by the backend.

Examples:

- Employees can access their own permitted records.
- Managers can access authorized team records.
- HR Admin can access organization-wide records within the approved permission model.
- Financial and document information must not be exposed to managers.
- Cross-organization access must be denied.

### 8.4 Auditability

Audit events should be considered for:

- Employee creation and deactivation.
- Employment changes.
- Leave policy changes.
- Leave balance adjustments.
- Approval decisions.
- Administrative overrides.
- Permission changes.
- Integration configuration changes.
- Data migration and reconciliation corrections.

The exact audit schema, retention period and access policy remain to be finalized.

---

## 9. Integrations and Data Migration

### 9.1 Google SSO

Before implementation, confirm:

- Approved Google domains.
- Identity mapping rules.
- Account linking behavior.
- Account provisioning and deprovisioning.
- MFA expectations.
- Session and logout behavior.

### 9.2 Jira Integration

Confirm:

- Jira deployment and API access.
- Worklog permissions.
- Project-to-organization and project-to-employee mapping.
- Synchronization frequency.
- Incremental sync and retry behavior.
- Duplicate and correction handling.
- Source precedence between Jira, bulk upload and manual updates.

### 9.3 Biometric Integration

Confirm:

- Vendor and device models.
- API, webhook or file-feed availability.
- Authentication mechanism.
- Event and timestamp format.
- Time zone and shift mapping.
- Sync frequency and acceptable data delay.
- Retry, deduplication and reconciliation requirements.

### 9.4 Migration Process

Proposed sequence:

1. Inventory and export source data.
2. Map source fields to the target model.
3. Validate required fields and relationships.
4. Clean and normalize malformed records.
5. Import into a non-production environment.
6. Reconcile employee records, balances and historical requests.
7. Run business and permission validation.
8. Obtain HR sign-off.
9. Execute the production migration.
10. Validate production data and monitor post-cutover behavior.

Migration must include employee records, leave balances and historical leave/WFH requests.

A cutover, rollback and reconciliation strategy must be approved before production migration.

---

## 10. Alternative Approaches and Trade-offs

### 10.1 Application Architecture

**Approach A — Modular monolith**

One backend application with feature-oriented modules.

Advantages:

- Lower operational complexity.
- Straightforward transactions across HR domains.
- Easier local development and debugging.
- Suitable for an initial product release.

Trade-offs:

- Requires disciplined module boundaries.
- Individual features cannot scale independently at deployment level.

**Approach B — Microservices**

Separate deployable services for domains such as attendance, onboarding and leave.

Advantages:

- Independent deployment and scaling.
- Stronger service-level ownership boundaries when the organization is ready for them.

Trade-offs:

- Distributed transactions and eventual consistency.
- More infrastructure, monitoring and deployment complexity.
- More difficult local development and integration testing.

**Preferred approach:** Modular monolith initially. Reassess service extraction when there is a measurable scaling, reliability or ownership requirement.

### 10.2 API Architecture

**Approach A — tRPC**

Advantages:

- Strong TypeScript inference between client and server.
- Less manual request/response type duplication.
- Well suited to a TypeScript-first monorepo.

Trade-offs:

- Tighter client/server coupling.
- Less direct support for non-TypeScript consumers.

**Approach B — REST with OpenAPI**

Advantages:

- Language-independent contracts.
- Broad ecosystem support for external consumers and integrations.
- Explicit HTTP resource semantics.

Trade-offs:

- Requires contract definition and generated-client or schema synchronization practices.

**Preferred approach:** tRPC for the internal web application, subject to the existing project setup. If external APIs become a requirement, evaluate a language-neutral public API contract separately.

### 10.3 Tenant Data Isolation

Evaluate shared database, separate schema and separate database strategies against customer isolation requirements, operating cost, backup/recovery, migrations and compliance.

**Preferred direction to evaluate:** organization-scoped records with enforced backend isolation, provided this meets the agreed security and compliance requirements.

This decision is not yet approved.

---

## 11. Testing and Bug Bash

### 11.1 Testing Strategy

- Unit tests for business rules and calculations.
- Integration tests for database operations and transaction behavior.
- API tests for validation and authorization.
- End-to-end tests for employee, manager and HR workflows.
- Permission tests for sensitive fields and tenant boundaries.
- Integration tests for Jira, Google and biometric providers.
- Migration tests and reconciliation.
- Regression tests for cross-module changes.
- Load and resilience tests against agreed performance targets.

### 11.2 Critical Scenarios

**Leave and WFH**

- Valid and invalid date ranges.
- Half-day and multi-day requests.
- Insufficient balance.
- Multiple approvers.
- Approval, rejection and cancellation.
- Duplicate submissions and concurrent requests.
- HR override and audit history.

**Onboarding**

- Invitation and resend.
- Scheduled invitation.
- Skip and resume steps.
- Failed and retried examination.
- Missing required information.
- Completion and lifecycle transitions.
- Existing employee onboarding.

**Employment history**

- Profile correction versus formal employment change.
- Effective dates.
- Promotion, department transfer and manager change.
- Historical ordering and current-state accuracy.

**Attendance**

- Duplicate biometric records.
- Missing or late synchronization.
- Weekend and holiday classification.
- Shift boundaries and time zones.
- Invalid external records.

**Permissions**

- Employee accessing another employee's private data.
- Manager accessing restricted financial/document fields.
- Manager access outside the authorized team.
- HR organization-level visibility.
- Cross-tenant access attempts.

### 11.3 Bug Bash Exit Criteria

- Critical and high-severity defects are resolved or explicitly accepted.
- Core end-to-end workflows pass.
- Authorization and tenant-isolation tests pass.
- Data reconciliation meets approved acceptance criteria.
- Integration failures are observable and recoverable.
- Product, QA and engineering agree on release readiness.

---

## 12. Monitoring and Operations

### 12.1 Required Observability

The production design should include:

- Application error rates.
- API latency and throughput.
- Database performance.
- Authentication failures.
- Authorization denials.
- Failed onboarding and notification operations.
- Leave workflow errors.
- Jira synchronization lag and failures.
- Biometric synchronization lag and failures.
- Migration and reconciliation results.
- Background-job retries and dead-letter activity, if queues are introduced.

### 12.2 Alerting

Alerts should be based on agreed service objectives and actionable failure conditions, rather than raw log volume alone.

The operational plan must identify the responsible team, escalation path and recovery procedure for critical failures.

Numerical thresholds and the observability platform remain open decisions.

---

## 13. Launch and Rollback Plan

### 13.1 Proposed Release Stages

1. Complete requirements and technical design review.
2. Implement and validate features in development.
3. Run integration and acceptance testing in QA/UAT.
4. Validate migrated data and reconcile differences.
5. Conduct security and permission testing.
6. Obtain product and HR acceptance.
7. Execute the production migration and cutover.
8. Monitor core workflows and integration health.
9. Retire the legacy mobile experience only after required web functionality is accepted.

### 13.2 Rollback Strategy

The release plan must define:

- Conditions that trigger rollback.
- Whether the previous application version can safely operate against the migrated database.
- Backup and restore procedures.
- Forward-fix versus database rollback decisions.
- Handling of requests created after cutover.
- Integration synchronization recovery.
- Communication and ownership during an incident.

Database rollback must not be assumed to be safe after new production writes have occurred. A tested recovery strategy is required.

### 13.3 Release Success Criteria

The release is considered successful when:

- Employees can perform required self-service workflows.
- Managers can manage authorized team requests without accessing restricted information.
- HR can manage employees, policies and workforce operations.
- Leave balances and workflow statuses remain correct.
- Jira and biometric data arrive within agreed operational targets.
- Migrated employee and historical request data is reconciled.
- The web experience meets the agreed mobile-replacement acceptance criteria.

---

## 14. Implementation Plan and Milestones

Exact calendar dates, effort estimates and staffing must be agreed after discovery and technical review.

| Milestone                | Deliverable                                                          | Dependency                  |
| ------------------------ | -------------------------------------------------------------------- | --------------------------- |
| M1 — Discovery           | Confirmed requirements and decision register                         | Client / PM workshops       |
| M2 — Architecture        | Approved technical design and domain model                           | Critical business decisions |
| M3 — Foundation          | Authentication, permissions, tenant boundary and core employee model | Architecture approval       |
| M4 — Employee lifecycle  | Employee profiles, employment history and onboarding                 | Foundation                  |
| M5 — Workforce workflows | Leave/WFH, approvals and policy configuration                        | Domain rules approved       |
| M6 — Workforce data      | Attendance, calendar and timesheet                                   | Integration contracts       |
| M7 — Supporting features | Notifications, announcements and settings                            | Core workflows              |
| M8 — Migration           | Validated and reconciled migrated data                               | Legacy exports and mapping  |
| M9 — Acceptance          | QA, bug bash, security and integration verification                  | Feature completion          |
| M10 — Launch             | Production cutover, monitoring and rollback readiness                | Stakeholder sign-off        |

The implementation order should be adjusted based on feature dependencies and the client's delivery priorities.

---

## 15. Open Product and Engineering Decisions

The following decisions must remain visible until resolved.

| ID     | Decision                                                                            | Owner(s)                         | Status |
| ------ | ----------------------------------------------------------------------------------- | -------------------------------- | ------ |
| OPD-01 | Confirm Pre-Hire versus New Hire terminology and lifecycle states                   | Product / HR                     | Open   |
| OPD-02 | Confirm the source and meaning of the My Score dashboard card                       | Product / HR                     | Open   |
| OPD-03 | Define whether productivity may exceed 100%                                         | Product / HR                     | Open   |
| OPD-04 | Define Probation-to-Active transition and related automation                        | HR / Product                     | Open   |
| OPD-05 | Define migration and access rules for existing employees with incomplete onboarding | HR / Engineering                 | Open   |
| ENG-01 | Select database and persistence technology                                          | Engineering                      | Open   |
| ENG-02 | Select tenant isolation strategy                                                    | Engineering / Security / Product | Open   |
| ENG-03 | Define performance, availability and recovery targets                               | Product / Engineering            | Open   |
| ENG-04 | Finalize leave balance calculation and reservation semantics                        | HR / Product / Engineering       | Open   |
| ENG-05 | Finalize approval ordering, delegation and cancellation behavior                    | HR / Product                     | Open   |
| ENG-06 | Confirm biometric vendor and synchronization contract                               | Client / Engineering             | Open   |
| ENG-07 | Confirm Jira mapping and synchronization rules                                      | Client / Engineering             | Open   |
| ENG-08 | Confirm notification delivery and retry requirements                                | Product / Engineering            | Open   |
| ENG-09 | Confirm production migration and cutover approach                                   | Engineering / HR                 | Open   |
| ENG-10 | Confirm SaaS platform administration and organization provisioning requirements     | Product / Engineering            | Open   |

Additional questions should be added when discovery identifies decisions that affect scope, security, data modeling or delivery.

---

## 16. Approval and Change Management

This document remains a proposal until the relevant stakeholders approve the requirements and design decisions.

### Required reviews

- Product / PM: business behavior and scope.
- HR / Operations: policies and operational workflows.
- Lead Engineer: architecture, maintainability and technical feasibility.
- UX: navigation, usability and role-specific experiences.
- QA: testability and acceptance criteria.
- Security / Operations: access controls, deployment and recovery where applicable.

### Change process

When a requirement changes:

1. Record the requested change.
2. Identify affected requirements, decisions and acceptance criteria.
3. Assess impact on architecture, data, APIs, implementation and delivery dates.
4. Review the change with the relevant stakeholders.
5. Update this document and linked tickets.
6. Obtain approval before implementing changes that materially affect the agreed design.

### Definition of Done for the Design Phase

- Phase 1 scope is agreed.
- Critical open product decisions have owners and resolution plans.
- The architecture and domain boundaries are reviewed.
- Tenant isolation and authorization requirements are agreed.
- Core workflows and data integrity rules are defined.
- Integration contracts and migration dependencies are understood.
- Testing, monitoring, launch and rollback responsibilities are defined.
- Product and engineering approve the design baseline.

---

**Final note:** This document is intentionally a draft. It provides a structured engineering direction from the supplied requirements, while leaving unresolved business behavior and implementation-specific choices visible for discussion. The next step is a requirements workshop followed by an engineering design review—not immediate implementation of every proposed component.
