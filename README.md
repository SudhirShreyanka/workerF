# Email Worker Frontend (Railway BFF)

A modern, responsive web application and Backend-For-Frontend (BFF) reverse proxy for the Email Worker service. Designed for deployment on [Railway](https://railway.com/).

---

## Security & Architecture Features

- **No Secrets in the Browser**: The `API_SECRET` and Render backend URL are stored strictly in Railway server-side environment variables. Visitors never see internal credentials or URLs in browser JavaScript or network requests.
- **Same-Origin API**: The browser makes standard HTTPS requests to its own origin (`/api/send-email`). Railway's server forwards the request to Render with the `Authorization: Bearer <API_SECRET>` header.
- **Live Health Monitoring**: Probes backend status via `/api/backend-health` without exposing the internal Render URL.
- **Zero SMTP Dependency**: The frontend contains no Gmail credentials, Nodemailer code, or direct SMTP dependencies.

---

## Directory Structure

```text
frontend/
├── public/
│   ├── index.html        # Clean, modern UI markup
│   ├── style.css         # Dark theme & responsive styling
│   └── app.js            # Client-side validation & dispatch logic
├── src/
│   ├── config.js         # Frontend configuration
│   └── server.js         # Express BFF reverse proxy server
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore file
├── package.json          # Dependencies & scripts
└── README.md             # Frontend setup & deployment guide
```

---

## Environment Variables

Configure these variables in your Railway Dashboard:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Auto-assigned by Railway | `3000` |
| `BACKEND_URL` | Your Render Backend API URL | `https://my-email-backend.onrender.com` |
| `API_SECRET` | Secret token shared with backend | `your_strong_random_secret` |

---

## Local Development

```bash
cd frontend
npm install
cp .env.example .env
# Set BACKEND_URL=http://localhost:5000 and API_SECRET in .env
npm run dev
```

---

## Railway Deployment Instructions

1. Push this `frontend` directory to a GitHub repository (e.g. `github.com/<user>/email-worker-frontend`).
2. Log into [Railway](https://railway.com/dashboard) and click **+ New Project**.
3. Choose **Deploy from GitHub repo** and select your frontend repository.
4. In the service **Variables** tab, add:
   - `BACKEND_URL`: Your Render backend URL (e.g. `https://my-backend.onrender.com`).
   - `API_SECRET`: The same secret token configured on your Render backend.
5. In **Settings** → **Networking**, click **Generate Domain**.
6. Set the Healthcheck Path to `/health`.
7. Once deployed, open your Railway domain to access the UI and test email dispatches.
