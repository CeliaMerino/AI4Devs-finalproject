# book-tracker-read-format Specification

## Purpose

Selectable read format (physical, ebook, audio) in Book Tracker and completion modal; format remains null until the user chooses (KAN-30, UC-04).

## Requirements

### Requirement: Inline read format column

The Book Tracker SHALL display an editable read format control per row.

#### Scenario: Select format inline (UC-04, KAN-30)

- **WHEN** the user chooses Físico, Ebook, or Audio from the row format selector
- **THEN** the client PATCHes `read_format` and the row updates

#### Scenario: Empty until chosen

- **WHEN** a book is created or status changes without explicit format selection
- **THEN** `read_format` remains null and the selector shows empty

#### Scenario: Accessible format control

- **WHEN** the format selector receives keyboard focus
- **THEN** it has an associated label and is operable without a mouse
