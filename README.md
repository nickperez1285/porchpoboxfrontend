# Porch PO Box Frontend

This repo contains the React frontend for Porch P.O. Box.

## Responsibility

- Public website UI
- Firebase auth and Firestore reads/writes from the browser
- Vendor registration form UI
- Calls the backend API for server-side actions such as vendor registration emails

This repo is not the source of truth for the production backend.

## Production Mapping

- Frontend repo: `nickperez1285/porchpoboxfrontend`
- Frontend deployment: Vercel frontend project for `www.porchpobox.com`
- Production backend repo: `nickperez1285/poboxbackend`
- Production backend URL: configured through `REACT_APP_API_URL`

## Important Client Env Vars

- `REACT_APP_API_URL`
  - Base URL for the production backend
  - Example: `https://poboxbackend.vercel.app`

## Backend Ownership

The following logic belongs in the backend repo, not here:

- Email sending
- Payment server logic
- Resend integration
- Any secret/API-key based operations

## Vendor Registration Flow

The frontend vendor registration page posts email notification requests to:

- `/api/notifications/vendor-registration` on the backend

The backend is responsible for:

- sending the admin notification to `contact@porchpobox.com`
- sending the vendor confirmation email

## Notes

- If vendor email behavior breaks in production, check `poboxbackend` first.
- Do not add duplicated backend logic to this repo unless intentionally moving to frontend-hosted serverless routes.
