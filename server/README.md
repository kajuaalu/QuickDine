# QuickDine server

## Configuration and startup

Set `MONGODB_URI` to the MongoDB connection URI through your deployment's secret
store. For local development, put it in an ignored `server/.env` file. Never
commit database credentials. `PORT` is optional and defaults to `5000`.

From `server/`, run `npm ci` and then `npm start`. The server listens only after
MongoDB connects. Missing configuration or a failed connection exits with code
`1` without starting the HTTP server.

## Exposed credential rotation

The MongoDB credential previously committed to `config/db.ts` must be rotated
by a database administrator. In MongoDB Atlas, change the affected database
user's password or replace that user and revoke the old user's access. Update
the deployment's `MONGODB_URI` secret with the new credential and restart the
server. Confirm the old credential can no longer authenticate. Removing the URI
from source does not revoke the credential or remove it from Git history.
