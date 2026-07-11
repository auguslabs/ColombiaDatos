# Security Specification for ColombIA Datos

## Data Invariants
1. A user profile (`/users/{uid}`) must be ownable by the user. Only the owner can read/write their non-role profile data.
2. Roles (`role` field) can only be set to "public" by the user on creation. Updates to `role` or existing `admin` status must be restricted to existing admins or impossible for users.
3. Conversations (`/conversations/{id}`) belong to a `userId`. Only that user can read, create, or update the conversation.
4. Messages (`/conversations/{id}/messages/{msgId}`) belong to a parent conversation. Access is inherited from the parent conversation.
5. DataSources (`/dataSources/{id}`) are readable by all authenticated users but only writable/manageable by users with the `admin` role in their `/users/{uid}` document.

## The Dirty Dozen (Attacker Payloads)

1. **Identity Spoofing**: Attempt to create a `/users/attacker` document with `role: "admin"`.
2. **Conversation Hijacking**: User B tries to read `/conversations/userA_chat_1`.
3. **Data Source Poisoning**: Authenticated non-admin tries to delete or modify a `DataSource`.
4. **Shadow Field Injection**: Adding `isVerified: true` to a conversation document.
5. **PII Leak**: Non-admin trying to `list` all users.
6. **Message Injection**: User B tries to add a message to User A's conversation.
7. **Timestamp Fraud**: Sending a custom `createdAt` from the client that isn't `request.time`.
8. **ID Poisoning**: Creating a conversation with a 2MB string as the document ID.
9. **Role Escalation**: Regular user tries to update their own role from "public" to "admin".
10. **Orphaned Message**: Creating a message for a non-existent conversation.
11. **Excessive Writes**: Sending a message with a 1MB `content` field.
12. **Metadata Tampering**: Changing the `userId` of an existing conversation to another user's ID.

## Test Runner (Logic Check)
The `firestore.rules` will be designed to block all the above.

```typescript
// firestore.rules.test.ts logic (conceptual)
// ... tests for each of the above ...
```
