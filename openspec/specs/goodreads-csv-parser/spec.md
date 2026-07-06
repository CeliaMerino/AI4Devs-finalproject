# goodreads-csv-parser Specification

## Purpose

Parse Goodreads library CSV exports via authenticated upload endpoint (KAN-44, US-13).

## Requirements

### Requirement: Parse Goodreads CSV upload

The system SHALL expose `POST /v1/import/goodreads` accepting a multipart `file` field with a Goodreads library export CSV. The endpoint SHALL parse UTF-8 quoted CSV, validate required Goodreads headers, clean ISBN/ISBN13 Excel wrappers (`="…"`), return normalized rows for downstream mapping without persisting books, and SHALL include `mapped_rows` produced by the Goodreads field mapper (KAN-45).

#### Scenario: Valid export parsed with mapped drafts

- **WHEN** the client uploads a standard Goodreads library CSV
- **THEN** the response includes `rows`, `mapped_rows` with book and reading_record drafts, and `meta.parsed_rows` matching data rows

#### Scenario: Valid export parsed

- **WHEN** the client uploads a standard Goodreads library CSV
- **THEN** the response includes `rows` with cleaned ISBN fields and `meta.parsed_rows` matching data rows

#### Scenario: Missing file rejected

- **WHEN** the request has no `file` field
- **THEN** the API responds with HTTP 400

#### Scenario: Invalid headers rejected

- **WHEN** required Goodreads columns are missing
- **THEN** the API responds with HTTP 400

#### Scenario: Malformed row skipped with warning

- **WHEN** a data row has the wrong column count
- **THEN** the row is skipped and a warning is included in `warnings`
