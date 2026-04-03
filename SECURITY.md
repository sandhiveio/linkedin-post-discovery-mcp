# Security Policy

## Credential model
This project is BYO-credentials only.

- Users must create and use **their own** `RAPIDAPI_KEY`, `RAPIDAPI_HOST`, and/or `APIFY_TOKEN`.
- Do not paste secrets into source code, commits, issues, screenshots, or logs.
- Never commit a real `.env` file.

## Incident handling
If any key/token is exposed, rotate it immediately in the upstream provider dashboard:

- RapidAPI key: rotate in RapidAPI account settings.
- Apify token: revoke and create a new token in Apify.

## Logging hygiene
- This server never intentionally prints raw secrets.
- Debug output masks secrets (e.g., `abc***xyz`).
- Keep `DEBUG=false` in normal use.

## Scope and limitation
This repository is a thin wrapper over upstream APIs and does not implement user accounts, billing, or storage.
