# Engineering Course Hub

A complete static course-sharing website for engineering students across **10 semesters**.

## Features

- 10 semesters with multiple courses per semester
- 50+ sample engineering courses (easy to edit)
- Real-time search across all courses
- Course details with file listings (OneDrive links)
- Dark mode with saved preference
- Responsive UI (mobile, tablet, desktop)
- Breadcrumb navigation
- Contact/feedback form (Formspree-ready)
- GitHub Pages compatible (no backend)

## File Structure

- `/index.html` — single-page app layout
- `/styles.css` — responsive styling and dark mode
- `/app.js` — rendering, navigation, search, and form logic
- `/data.json` — course data source (easy to maintain)
- `/README.md` — setup and customization guide

## Setup

1. Clone the repository.
2. Ensure these files are in the repository root.
3. Open with a local static server (recommended) or deploy to GitHub Pages.

Example local server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Customize Courses (`data.json`)

Each semester uses this structure:

```json
{
  "semester_1": [
    {
      "id": "ENGR101",
      "name": "Engineering Fundamentals",
      "description": "Introduction to engineering principles",
      "files": [
        {
          "name": "Lecture Notes",
          "type": "pdf",
          "size": "2.5 MB",
          "url": "https://onedrive.live.com/..."
        }
      ]
    }
  ]
}
```

You can:

- Rename courses and descriptions
- Add/remove courses in any semester
- Add/remove files in each course

## Add OneDrive Links

1. Upload files to OneDrive.
2. Set sharing to **Anyone with the link can view** (or your preferred policy).
3. Copy each share URL.
4. Replace `url` values in `data.json`.

## Connect Formspree

1. Create a form at [Formspree](https://formspree.io/).
2. Copy your endpoint (example: `https://formspree.io/f/abcxyz`).
3. In `index.html`, update:

```html
<form action="https://formspree.io/f/your-form-id" method="POST">
```

## Deploy to GitHub Pages

1. Push files to your default branch.
2. Go to **Repository Settings → Pages**.
3. Source: **Deploy from branch**.
4. Branch: `main` (or your default), folder: `/ (root)`.
5. Save and wait for deployment.

## Troubleshooting

- **Data not loading**: Host with a web server (GitHub Pages or local server), not direct `file://` usage.
- **Form not sending**: Verify Formspree endpoint is correctly set.
- **Broken file button**: Ensure each `url` in `data.json` is a valid OneDrive share link.
- **Dark mode not remembered**: Ensure browser allows localStorage.
