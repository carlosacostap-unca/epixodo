## ADDED Requirements

### Requirement: Conversation management
The system SHALL allow an authenticated user to create, list, open, rename, and delete personal companion conversations, and SHALL isolate every conversation by its owner.

#### Scenario: First message creates a conversation
- **WHEN** an authenticated user sends a message without selecting an existing conversation
- **THEN** the system creates a conversation owned by that user with a concise title derived from the message and returns the persisted exchange

#### Scenario: User resumes a conversation
- **WHEN** an authenticated user opens one of their saved conversations
- **THEN** the system returns its messages in chronological order and allows the user to continue it

#### Scenario: User renames a conversation
- **WHEN** an authenticated user submits a valid new title for one of their conversations
- **THEN** the system persists and displays the new title

#### Scenario: User deletes a conversation
- **WHEN** an authenticated user confirms deletion of one of their conversations
- **THEN** the system removes the conversation and all of its messages

#### Scenario: User requests another owner's conversation
- **WHEN** an authenticated user references a conversation not owned by them
- **THEN** the system returns a not-found response without exposing its content or existence

### Requirement: Contextual AI replies
The system SHALL persist each accepted user message, generate a Spanish-language companion reply using bounded recent history from the selected conversation, and persist the reply with its role and timestamp.

#### Scenario: Successful reply
- **WHEN** an authenticated user sends a non-empty message within the configured length limit
- **THEN** the system stores the user message, sends bounded server-loaded context to OpenAI with remote storage disabled, stores the assistant response, and returns both messages

#### Scenario: AI provider failure
- **WHEN** the user message is valid and persisted but the AI provider fails
- **THEN** the system preserves the user message and returns a recoverable error without storing a fabricated assistant message

#### Scenario: Invalid message
- **WHEN** a message is empty or exceeds the configured length limit
- **THEN** the system rejects it without calling the AI provider

### Requirement: Companion tone and safety boundaries
The system MUST instruct the AI to respond as a warm, honest conversational companion, MUST avoid claiming to be a therapist or human, and MUST prioritize immediate human or emergency support when the user expresses clear imminent danger.

#### Scenario: Everyday reflection
- **WHEN** the user shares an ordinary feeling, thought, daily outcome, or pending concern
- **THEN** the response acknowledges the substance, avoids empty positivity, and offers at most one useful question or next step when appropriate

#### Scenario: Imminent danger
- **WHEN** the user expresses a clear intention or immediate risk of harming themselves or another person
- **THEN** the response prioritizes immediate safety, encourages contacting local emergency services or a trusted person nearby, and asks whether the user is currently safe

### Requirement: Companion user experience
The system SHALL provide an accessible and responsive companion view with conversation navigation, chronological messages, a multiline composer, send feedback, empty guidance, errors, and clear privacy and scope copy.

#### Scenario: Empty companion space
- **WHEN** the user has no selected conversation or saved history
- **THEN** the view invites them to start with examples such as how they feel, what occupies their mind, or how their day went without forcing a category

#### Scenario: Message submission in progress
- **WHEN** a message is being submitted
- **THEN** the composer prevents duplicate submission, preserves visible context, and indicates that a response is being prepared

#### Scenario: Keyboard and mobile use
- **WHEN** the view is used with a keyboard or on a narrow screen
- **THEN** all conversation and composer actions remain reachable with visible focus and without horizontal page overflow
