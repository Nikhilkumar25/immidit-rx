# immidit RX System — Google Sheets Setup Guide

## Overview

Your prescription system uses **Google Sheets as its database**. This means:
- All doctor accounts and prescriptions are stored in a Google Spreadsheet
- The admin can view/edit data directly in the spreadsheet
- No server to maintain — Google runs everything
- Free forever

---

## Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it **"immidit RX Database"**

---

## Step 2: Add the Apps Script

1. In your spreadsheet, click **Extensions → Apps Script**
2. This opens the script editor in a new tab
3. **Delete** any default code in `Code.gs`
4. Open the `Code.gs` file from this project and **copy-paste the entire contents**
5. Click **Save** (Ctrl+S)

---

## Step 3: Run Initial Setup

1. In the Apps Script editor, select the function **`setupSheets`** from the dropdown at the top
2. Click **▶ Run**
3. Google will ask for permissions — click **Advanced → Go to immidit RX Database (unsafe) → Allow**
4. You should see an alert: "✅ Setup Complete!"
5. Go back to your spreadsheet — you'll see 4 new tabs:
   - **Config** — Admin credentials (username, password)
   - **Doctors** — All doctor accounts (with one demo: dr.priya)
   - **Prescriptions** — All prescriptions (empty initially)
   - **Drafts** — Auto-saved drafts

---

## Step 4: Deploy as Web App

1. Go back to the Apps Script editor
2. Click **Deploy → New Deployment**
3. Click the gear icon ⚙️ → Select **Web app**
4. Settings:
   - **Description**: `immidit RX API`
   - **Execute as**: `Me` (your Google account)
   - **Who has access**: `Anyone`
5. Click **Deploy**
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## Step 5: Configure the Frontend

1. Open `index.html` in a text editor
2. Find this line near the top of the `<script>`:
   ```javascript
   const SHEET_API = '';  // ← PASTE YOUR GOOGLE APPS SCRIPT URL HERE
   ```
3. Paste your Web App URL between the quotes:
   ```javascript
   const SHEET_API = 'https://script.google.com/macros/s/AKfycbx.../exec';
   ```
4. Save the file

---

## Step 6: Deploy the Frontend

### Option A: Vercel (recommended)
1. Push the folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com), import the repo
3. Deploy — Vercel will serve `index.html` as a static site

### Option B: GitHub Pages
1. Push to GitHub
2. Go to repo Settings → Pages → Deploy from branch
3. Your site is live at `username.github.io/repo-name`

### Option C: Just open locally
- Double-click `index.html` — it works as a local file too!

---

## Managing the System

### Change Admin Password
1. Open the Google Sheet
2. Go to the **Config** tab
3. Change the `admin_password` value

### View All Prescriptions
1. Open the Google Sheet → **Prescriptions** tab
2. Each row has the prescription data in JSON format
3. You can sort, filter, search directly in the spreadsheet

### Add/Remove Doctors
- Use the app's Admin panel (recommended)
- Or edit the **Doctors** tab directly in the spreadsheet

### Backup
- Google Sheets has automatic version history (File → Version history)
- You can also download as Excel/CSV from the spreadsheet

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Connecting to immidit..." hangs | Check that SHEET_API URL is correct and the Apps Script is deployed |
| "Failed to sync" toast | Check browser console for errors. The app works offline using cached data |
| CORS errors | Make sure the Apps Script deployment has "Who has access: Anyone" |
| Data not updating | Go to Apps Script → Deploy → Manage deployments → Update to latest version |
| Need to redeploy after Code.gs change | Deploy → Manage deployments → Edit (pencil icon) → Version: New version → Deploy |
