# Authentication Setup

This app uses Firebase Authentication for:

- Email/password registration
- Email/password login
- Google popup login
- Persistent auth state
- Logout
- Google Identity Services token login

## Local setup

1. Create a Firebase project.
2. Add a Web app in Firebase project settings.
3. Copy `.env.example` to `.env.local`.
4. Paste the Firebase web app config values into `.env.local`.
5. In Firebase Console, open Authentication, then Sign-in method.
6. Enable Email/Password.
7. Enable Google.
8. Add `localhost` and `127.0.0.1` to Authentication authorized domains if needed.
9. Restart the Vite dev server.

The current local project is wired to Firebase project `cubeicons-ad59f`.

Google login uses Google Identity Services to obtain a Google ID token, then signs
into Firebase with `GoogleAuthProvider.credential(...)`. The OAuth client allows
these local JavaScript origins:

- `http://localhost`
- `http://localhost:5000`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Google says OAuth client origin changes can take several minutes to propagate. If
port `5173` reports an origin mismatch right after setup, use `http://localhost`
on port `80` or wait for propagation.
