# Security Specification for LicitHub

## Data Invariants
1. A user can only access opportunities they created or are shared with (simplified to creator-only for MVP).
2. Documents containing potentially sensitive fiscal data are strictly owner-restricted.
3. Tasks and Analysis must be linked to a valid Opportunity document that the user has access to.
4. Timestamps (`createdAt`, `updatedAt`) must always be validated against `request.time`.
5. Business fields like `status` follow a specific enum and cannot be updated once in terminal states (won/lost) except by admins (if applicable).

## The Dirty Dozen (Threat Payloads)
1. **Identity Theft**: User A tries to create an opportunity with `creatorId: "UserB"`.
2. **Orphaned Write**: Creating a Task for an `opportunityId` that doesn't exist.
3. **Status Hijack**: Changing an Opportunity status from "won" back to "monitoring" to bypass analytics.
4. **ID Poisoning**: Injecting a 2KB string as a document ID.
5. **Time Travel**: Attempting to set `createdAt` to a date in the past.
6. **Mass Update**: Trying to update `creatorId` on an existing document.
7. **Cross-Tenant Access**: User A tries to `get` an Analysis document belonging to User B.
8. **Shadow Fields**: Adding `isAdmin: true` to an Opportunity document.
9. **Bulk Scraper**: Authenticated user trying to `list` all opportunities in the system without creator filters.
10. **Type Injection**: Setting `value` (number) as a string "100.00".
11. **Enum Bypass**: Setting `status` to "invalid_status".
12. **Document Exfiltration**: Trying to read a Document meta-data without being the owner.

## Security Controls
- **Attribute-Based Access Control (ABAC)**: Checks `resource.data.creatorId` against `request.auth.uid`.
- **Schema Validation**: Standalone `isValid[Entity]` helpers for each collection.
- **Relational Integrity**: `existsAfter` or `get()` checks for cross-collection links.
