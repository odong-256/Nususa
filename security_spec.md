# Security Specification: NUSUSA Online Voting System

## 1. System Invariants
- **Identity Invariant**: A voter account is bound to `request.auth.uid`. A student cannot impersonate another student or alter another student's account.
- **Voter Approval Invariant**: A user cannot modify their own `status` (pending/approved/rejected/suspended) or `role` (voter/admin). Only admins can approve or change voter statuses.
- **One Vote Per Election Invariant**: A ballot document ID is strictly formatted as `{electionId}_{voterId}` where `{voterId} == request.auth.uid`. A ballot cannot be modified or deleted once created (`allow update, delete: if false`).
- **Active Election Constraint**: A ballot can only be submitted if the referenced election exists and its status is `open`.
- **Admin Privilege Invariant**: Administrative modifications to elections, positions, candidates, and voter approvals are strictly restricted to verified administrators in `/admins/{adminId}` or root administrative authority.
- **Audit Trail Immutability**: Audit logs are append-only. Once written, audit records cannot be altered or deleted.

## 2. Dirty Dozen Payloads (Designed to break laws of Identity, Integrity, and State)
1. **Self-Promotion**: Voter attempts to update their own role from `voter` to `admin`. (Must be REJECTED).
2. **Self-Approval**: Pending voter attempts to change their own status from `pending` to `approved`. (Must be REJECTED).
3. **Double Vote**: Voter submits a second ballot for the same election using the same or modified document ID. (Must be REJECTED).
4. **Post-Vote Tampering**: Voter attempts to update candidate selections on a previously cast ballot. (Must be REJECTED).
5. **Ballot Deletion**: Voter attempts to delete their ballot to vote again. (Must be REJECTED).
6. **Closed Election Ballot**: Voter attempts to submit a ballot to an election whose status is `closed` or `draft`. (Must be REJECTED).
7. **Cross-User Ballot Spoofing**: User A attempts to submit a ballot with User B's `voterId`. (Must be REJECTED).
8. **Candidate Vote Count Forgery**: Non-admin directly modifies candidate `voteCount` directly on the candidate document. (Must be REJECTED).
9. **Unauthorized Candidate Creation**: Regular student attempts to create or delete a candidate. (Must be REJECTED).
10. **Unauthorized Election Schedule Tampering**: Student attempts to change election start or end dates. (Must be REJECTED).
11. **Voter PII Scraping**: Unapproved student attempts to download the full directory of other student voter emails and phone numbers. (Must be REJECTED).
12. **Audit Trail Erasure**: User attempts to delete security audit logs. (Must be REJECTED).
