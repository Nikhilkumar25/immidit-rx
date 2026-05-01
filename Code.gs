/**
 * ═══════════════════════════════════════════════════════════════════
 *  immidit RX System — Google Sheets Backend
 * ═══════════════════════════════════════════════════════════════════
 *
 *  SETUP:
 *  1. Create a Google Sheet
 *  2. Extensions → Apps Script
 *  3. Paste this entire file into Code.gs
 *  4. Run the setupSheets() function ONCE (it creates tabs + seed data)
 *  5. Deploy → New Deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  6. Copy the deployment URL into your index.html SHEET_API constant
 */

// ── HELPERS ──────────────────────────────────────────────────────

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeJSON(str) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : (str || {});
  } catch(e) {
    return {};
  }
}

function toBool(val) {
  if (val === true || val === 'TRUE' || val === 'true' || val === 1) return true;
  return false;
}

// ── GET HANDLER ──────────────────────────────────────────────────
// Called when the frontend does: fetch(SHEET_API + '?action=pull')

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'pull';
    if (action === 'pull') return pullAll();
    return jsonResponse({ error: 'Unknown GET action: ' + action });
  } catch(err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ── POST HANDLER ─────────────────────────────────────────────────
// Called when the frontend does: fetch(SHEET_API, { method: 'POST', body: ... })

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    switch(body.action) {
      case 'saveDoctors':
        return saveDoctorsToSheet(body.data);
      case 'addPrescription':
        return addPrescriptionToSheet(body.data);
      case 'updatePrescription':
        return updatePrescriptionInSheet(body.data);
      case 'saveDraft':
        return saveDraftToSheet(body.doctorId, body.data);
      case 'deleteDraft':
        return deleteDraftFromSheet(body.doctorId);
      case 'uploadReport':
        return uploadReportToDrive(body.data);
      default:
        return jsonResponse({ error: 'Unknown POST action: ' + body.action });
    }
  } catch(err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ══════════════════════════════════════════════════════════════════
//  PULL — fetch everything from the sheet
// ══════════════════════════════════════════════════════════════════

function pullAll() {
  // ── Admin config ──
  var configSheet = getSheet('Config');
  var configData = configSheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < configData.length; i++) {
    if (configData[i][0]) config[configData[i][0]] = configData[i][1];
  }
  var admin = {
    username: config['admin_username'] || 'admin',
    password: config['admin_password'] || 'immidit@2026',
  };

  // ── Doctors ──
  var docSheet = getSheet('Doctors');
  var docData = docSheet.getDataRange().getValues();
  var doctors = [];
  for (var i = 1; i < docData.length; i++) {
    if (!docData[i][0]) continue; // skip empty rows
    doctors.push({
      id:              docData[i][0],
      username:        docData[i][1],
      password:        docData[i][2],
      active:          toBool(docData[i][3]),
      profileComplete: toBool(docData[i][4]),
      profile:         safeJSON(docData[i][5]),
      createdAt:       docData[i][6] || new Date().toISOString(),
    });
  }

  // ── Prescriptions ──
  var rxSheet = getSheet('Prescriptions');
  var rxData = rxSheet.getDataRange().getValues();
  var prescriptions = [];
  for (var i = 1; i < rxData.length; i++) {
    if (!rxData[i][0]) continue;
    var rx = safeJSON(rxData[i][2]);
    if (rx && rx.id) {
      prescriptions.push(rx);
    }
  }

  return jsonResponse({
    admin: admin,
    doctors: doctors,
    prescriptions: prescriptions,
    synced: new Date().toISOString(),
  });
}

// ══════════════════════════════════════════════════════════════════
//  SAVE DOCTORS — replace entire Doctors sheet
// ══════════════════════════════════════════════════════════════════

function saveDoctorsToSheet(doctors) {
  var sheet = getSheet('Doctors');
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }

  var rows = [];
  for (var i = 0; i < doctors.length; i++) {
    var d = doctors[i];
    rows.push([
      d.id,
      d.username,
      d.password,
      d.active ? 'TRUE' : 'FALSE',
      d.profileComplete ? 'TRUE' : 'FALSE',
      JSON.stringify(d.profile || {}),
      d.createdAt || new Date().toISOString(),
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }

  return jsonResponse({ ok: true, count: rows.length });
}

// ══════════════════════════════════════════════════════════════════
//  ADD PRESCRIPTION — append one row
// ══════════════════════════════════════════════════════════════════

function addPrescriptionToSheet(rx) {
  var sheet = getSheet('Prescriptions');
  sheet.appendRow([
    rx.id,
    rx.doctorId,
    JSON.stringify(rx),
    rx.createdAt || new Date().toISOString(),
    '',
  ]);
  return jsonResponse({ ok: true, id: rx.id });
}

// ══════════════════════════════════════════════════════════════════
//  UPDATE PRESCRIPTION — find by ID and update
// ══════════════════════════════════════════════════════════════════

function updatePrescriptionInSheet(rx) {
  var sheet = getSheet('Prescriptions');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === rx.id) {
      sheet.getRange(i + 1, 3).setValue(JSON.stringify(rx));
      sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
      return jsonResponse({ ok: true, updated: true });
    }
  }

  // Not found — add as new
  return addPrescriptionToSheet(rx);
}

// ══════════════════════════════════════════════════════════════════
//  DRAFTS — one draft per doctor
// ══════════════════════════════════════════════════════════════════

function saveDraftToSheet(doctorId, data) {
  var sheet = getSheet('Drafts');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === doctorId) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(data));
      sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
      return jsonResponse({ ok: true });
    }
  }

  sheet.appendRow([doctorId, JSON.stringify(data), new Date().toISOString()]);
  return jsonResponse({ ok: true });
}

function deleteDraftFromSheet(doctorId) {
  var sheet = getSheet('Drafts');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === doctorId) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ ok: true });
    }
  }

  return jsonResponse({ ok: true });
}

// ══════════════════════════════════════════════════════════════════
//  REPORTS — Google Drive Upload
// ══════════════════════════════════════════════════════════════════

function uploadReportToDrive(data) {
  // data: { base64, name, type }
  try {
    var folder = getReportsFolder();
    var base64Data = data.base64.split(',')[1];
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, data.type, data.name);
    var file = folder.createFile(blob);
    
    // Make it readable by anyone with the link so frontend can display it
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Add to a 'Reports' log sheet for audit
    var logSheet = getSheet('Reports') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Reports');
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(['fileId', 'name', 'type', 'url', 'uploadedAt']);
    }
    logSheet.appendRow([file.getId(), data.name, data.type, file.getUrl(), new Date().toISOString()]);

    return jsonResponse({ 
      ok: true, 
      fileId: file.getId(), 
      url: "https://drive.google.com/uc?export=view&id=" + file.getId() // Direct view link
    });
  } catch(err) {
    return jsonResponse({ error: err.toString() });
  }
}

function getReportsFolder() {
  var folderName = "immidit_Reports";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}


// ══════════════════════════════════════════════════════════════════
//  INITIAL SETUP — run this function ONCE to create all sheets
// ══════════════════════════════════════════════════════════════════

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet;

  // ── Config ──
  if (!ss.getSheetByName('Config')) {
    sheet = ss.insertSheet('Config');
    sheet.appendRow(['key', 'value']);
    sheet.appendRow(['admin_username', 'admin']);
    sheet.appendRow(['admin_password', 'immidit@2026']);
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 300);
  }

  // ── Doctors ──
  if (!ss.getSheetByName('Doctors')) {
    sheet = ss.insertSheet('Doctors');
    sheet.appendRow(['id', 'username', 'password', 'active', 'profileComplete', 'profile_json', 'createdAt']);
    // Seed demo doctor
    sheet.appendRow([
      'DOC001',
      'dr.priya',
      'Priya@123',
      'TRUE',
      'TRUE',
      JSON.stringify({
        name: 'Dr. Priya Sharma',
        regId: 'MCI-DL-45231',
        specialty: 'General Physician & Internal Medicine',
        qualification: 'MBBS, MD (Internal Medicine)',
        experience: '11',
        phone: '+91 98765 43210',
        bio: 'Experienced physician specialising in internal medicine and infectious diseases.',
        signature: null,
        avatarInitials: 'PS',
      }),
      new Date().toISOString(),
    ]);
    sheet.setColumnWidth(6, 400);
  }

  // ── Prescriptions ──
  if (!ss.getSheetByName('Prescriptions')) {
    sheet = ss.insertSheet('Prescriptions');
    sheet.appendRow(['id', 'doctor_id', 'data_json', 'createdAt', 'updatedAt']);
    sheet.setColumnWidth(3, 500);
  }

  // ── Drafts ──
  if (!ss.getSheetByName('Drafts')) {
    sheet = ss.insertSheet('Drafts');
    sheet.appendRow(['doctor_id', 'data_json', 'savedAt']);
    sheet.setColumnWidth(2, 500);
  }

  SpreadsheetApp.getUi().alert(
    '✅ Setup Complete!\n\n' +
    'Sheets created: Config, Doctors, Prescriptions, Drafts, Reports\n' +
    'Demo doctor: dr.priya / Priya@123\n' +
    'Admin: admin / immidit@2026\n\n' +
    'Next step: Deploy → New Deployment → Web App'
  );
}

