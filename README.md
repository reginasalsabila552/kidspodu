# KidsPodu

Website and internal portal for **KidsPodu**, a learning, therapy, and sports center for children (including children with special needs) in Sidoarjo, East Java, Indonesia.

Live: https://kidspodu.web.app

## Features

**Public website**
- Home: profile, service programs (Therapy, Sports, Clinical Psychology Services, Vocational, Life Skills, Shadow Teacher, Intervention Teaching), team, founders, and testimonials
- Articles and article detail pages
- Contact page with an embedded map, plus registration and free-trial buttons via WhatsApp
- Basic SEO: `sitemap.xml`, `robots.txt`, structured data, and a custom 404 page

**Team portal** (`/portal-login`, email + password login)
- **Admin**: dashboard, child registration, attendance, session reports, article management (rich text editor), social media posts, team members, and testimonials
- **Trainers/therapists**: dashboard, program and session selection, session report input (with photos), and report history
- PDF export for reports
- Role-based access (`admin` / `pelatih`) enforced through Firebase Auth and Firestore Security Rules

## Tech Stack

- Plain HTML, CSS, and JavaScript (ES Modules), no build step
- Firebase: Authentication, Cloud Firestore, Cloud Storage, Hosting (SDK v10.13.0 via CDN)
- [jsPDF](https://github.com/parallax/jsPDF) and jsPDF-AutoTable for PDF export
- [Quill](https://quilljs.com/) for the article editor

## Project Structure

```
.
├── index.html, artikel.html, artikel-detail.html, kontak.html, 404.html   # public pages
├── portal-login.html                                                      # team login
├── dashboard-admin*.html                                                  # admin pages
├── dashboard-pelatih.html, pelatih-*.html                                 # trainer pages
├── css/                       # style.css, artikel.css
├── js/
│   ├── firebase-config.js     # Firebase initialization
│   ├── auth-guard.js          # role-based page protection
│   ├── *-service.js           # Firestore access per module (children, articles, reports, team, etc.)
│   ├── data.js                # program data + dummy fallback data
│   ├── report-pdf.js          # PDF report generator
│   └── ...                    # home, main, modals, rich text, etc.
├── assets/images/
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore composite indexes
├── storage.rules              # Cloud Storage security rules
├── firebase.json              # Hosting configuration
└── .firebaserc                # Firebase project alias
```

## Running Locally

There are no dependencies to install. Because the project uses ES Modules, serve it with a static server (do not open the files directly):

```bash
npx serve .
```

or:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:3000` (or `:8000`).

## Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com) and add a **Web app**.
2. Copy its config into `js/firebase-config.js` (replace the `firebaseConfig` values).
3. Enable **Authentication → Email/Password**, **Firestore Database**, **Storage**, and **Hosting**.
4. Replace the project ID in `.firebaserc` with your own.
5. Create the first admin account in Authentication, then create a document in the `users` collection with the account's UID as the document ID and the field `role: "admin"`. Trainer accounts are created from the admin portal.

If `apiKey` in `firebase-config.js` is set to `"REPLACE_ME"`, the site still runs using dummy data from `js/data.js`, without connecting to Firebase.

### Firestore Collections

`users`, `anak`, `session_reports`, `program_templates`, `team`, `founder`, `articles`, `testimonials`, `sosmed_posts`, `stats`, `stats_public`, `programs`

## Deployment

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

`firebase.json` currently contains only the Hosting configuration. To deploy rules and indexes from the CLI, add:

```json
{
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
  "storage": { "rules": "storage.rules" }
}
```

then run `firebase deploy --only firestore,storage`. Alternatively, paste the rules files directly into the Firebase Console.

## Security Notes

- The Firebase web config (`apiKey`, etc.) is public by design and safe to keep in the repository. Data is protected by **Security Rules**, so make sure `firestore.rules` and `storage.rules` are deployed.
- Never commit service account keys or `.env` files.

## License

Copyright © KidsPodu. All rights reserved.
