# Timetable Maker

A cross-platform, browser-based timetable app with a dark neon UI, 20 subject colours, background themes, Week A/Week B support, PNG/PDF export, and drag-and-drop editing.

## Features

- Dark, neon timetable grid (time slots × days).
- Add, edit, delete time slots and classes.
- 20 neon colours for lessons and events.
- 16 background themes including solid colours, gradients, geometric patterns, and CSS-generated nature/space pictures.
- Week A / Week B timetables, viewed individually or together.
- Duplicate a class to multiple selected days.
- Drag-and-drop classes between days and time slots.
- 12h / 24h time format toggle (default 24h).
- Monday–Friday by default with a toggle to show Saturday and Sunday.
- PNG and PDF export (single or combined weeks).
- JSON export/import for backups and offline editing.
- One-click duplicate of Week A to Week B (copies are independent).
- LocalStorage persistence.

## Run locally

The app is pure HTML/CSS/JS and does not need a build step. Because it uses `localStorage` and ES5-style modules (separate script tags), a simple local web server is recommended.

```bash
cd "/home/SkylarStone/Documents/Projects/Timetable maker"
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

To run the unit tests, open `http://localhost:8000/tests/`.

## Deploy to Firebase Hosting

The app is a static HTML/CSS/JS site, so it can be deployed directly to Firebase Hosting.

### One-time setup

1. Install the Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

   Or use `npx` without installing globally:

   ```bash
   npx -y firebase-tools@latest login
   ```

2. Log in to Firebase:

   ```bash
   firebase login
   ```

3. In the project folder, link your Firebase project:

   ```bash
   firebase use --add
   ```

   This creates a `.firebaserc` file with your project ID.

   Alternatively, copy the provided `.firebaserc.template` to `.firebaserc` and replace `<YOUR_FIREBASE_PROJECT_ID>` with your actual project ID.

4. The `firebase.json` file in this project already sets the public directory to the project root. If you run `firebase init hosting` later, do not overwrite `firebase.json` unless you want to change the configuration.

### Deploy

From the project folder:

```bash
cd "/home/SkylarStone/Documents/Projects/Timetable maker"
firebase deploy --only hosting
```

After it finishes, the CLI prints a public URL like `https://<project-id>.web.app`.

### Optional: bundle libraries for offline use

The only external resources are `html2canvas` and `jsPDF`, loaded from cdnjs. To remove the CDN dependency:

1. Create a `vendor/` folder.
2. Download [html2canvas](https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js) and [jsPDF](https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js) into it.
3. Update the `<script>` tags in `index.html` to point at `vendor/`.

## File structure

```
├── index.html
├── css/
│   ├── styles.css
│   └── themes.css
├── js/
│   ├── colors.js        # 20 neon colours
│   ├── themes.js        # background theme list
│   ├── state.js         # data model and LocalStorage
│   ├── ui.js            # rendering, modals, drag-and-drop
│   ├── export.js        # PNG/PDF export
│   └── app.js           # entry point
├── tests/
│   ├── index.html
│   └── state.tests.js
├── firebase.json
├── .firebaserc.template
└── plan.txt
```

## Keyboard / interaction tips

- Click an empty day cell to add a class.
- Click a class card to edit it.
- Drag a class card to another day/time slot to move it.
- Use the theme button to switch timetable backgrounds.
- Use the A/B/Both buttons to toggle Week A, Week B, or both.
