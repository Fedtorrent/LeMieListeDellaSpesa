/**
 * LA MIA SPESA - BACKEND V10 (RESURRECTION FIX)
 * Logica atomica, supporto MasterKey e Pessimistic Locking.
 * Fix: Permette il ripristino di una lista eliminata se i dati sono più recenti.
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const MASTER_KEY_DEFAULT = "1234";
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;

// Configurazione Tabelle
const SCHEMA = {
  'CATALOG': ['ID', 'Name', 'Category', 'Emoji', 'UsageCount', 'UpdatedAt', 'DeletedAt'],
  'LISTS': ['ID', 'Name', 'UpdatedAt', 'DeletedAt', 'LockedBy', 'LockedAt', 'DeviceName'],
  'ITEMS': ['ID', 'ListID', 'ProductID', 'IsChecked', 'Quantity', 'Unit', 'UpdatedAt', 'CustomMetadata', 'Notes'],
  'CONFIG': ['Key', 'Value']
};

function initSheets() {
  for (let name in SCHEMA) {
    let sheet = SS.getSheetByName(name);
    if (!sheet) {
      sheet = SS.insertSheet(name);
      sheet.appendRow(SCHEMA[name]).getRange(1, 1, 1, SCHEMA[name].length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else {
      const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const targetHeaders = SCHEMA[name];
      if (currentHeaders.length < targetHeaders.length) {
        for (let i = currentHeaders.length; i < targetHeaders.length; i++) {
          sheet.getRange(1, i + 1).setValue(targetHeaders[i]).setFontWeight('bold');
        }
      }
    }
    sheet.getRange("A:C").setNumberFormat("@");
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    initSheets();
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data;
    const clientMasterKey = payload.masterKey || "";
    const deviceId = payload.deviceId || "unknown";
    const deviceName = payload.deviceName || "Dispositivo Ignoto";

    const officialMasterKey = PropertiesService.getScriptProperties().getProperty('MASTER_KEY') || MASTER_KEY_DEFAULT;
    const isMaster = (clientMasterKey === officialMasterKey);

    if (action === 'save') {
      if (data.lists) {
        for (let l of data.lists) {
          const lockStatus = checkLock(l.id, deviceId);
          if (!lockStatus.canWrite && !isMaster) {
            return response({success: false, error: "Lista '" + l.name + "' bloccata da " + lockStatus.lockedByDevice});
          }
        }

        saveListsSecure(data.lists, deviceId, deviceName, isMaster);

        data.lists.forEach(l => {
          // Permette aggiornamento item solo se la lista NON è eliminata O sta venendo ripristinata
          if (isAlreadyDeletedOnDB('LISTS', l.id, l.updatedAt)) return;

          deleteItemsByListId(l.id);
          if (l.items && l.items.length > 0) {
            const itemsToInsert = l.items.map(i => [
              i.id, l.id, i.productId, i.isChecked ? 1 : 0, i.quantity, i.unit, i.updatedAt,
              i.customMetadata ? JSON.stringify(i.customMetadata) : '', i.notes || ''
            ]);
            appendData('ITEMS', itemsToInsert);
          }
        });
      }
      if (data.db) {
        const dbRows = data.db.map(p => [p.id, p.normalizedName, p.category, p.emoji, p.usageCount, p.updatedAt, '']);
        upsertData('CATALOG', dbRows);
      }
      if (data.deletedListIds) {
        for (let id in data.deletedListIds) markAsDeleted('LISTS', id, data.deletedListIds[id]);
      }
      if (data.deletedProductIds) {
        for (let id in data.deletedProductIds) markAsDeleted('CATALOG', id, data.deletedProductIds[id]);
      }
      if (data.categoryColors) upsertConfig('categoryColors', JSON.stringify(data.categoryColors));
      if (data.emojiLibrary) upsertConfig('emojiLibrary', JSON.stringify(data.emojiLibrary));
      return response({success: true, isMaster});
    }

    if (action === 'acquireLock') {
      const res = tryAcquireLock(data.listId, deviceId, deviceName);
      return response(res);
    }
    if (action === 'releaseLock') {
      tryReleaseLock(data.listId, deviceId);
      return response({success: true});
    }
    if (action === 'cleanup') {
      cleanupTombstones(30);
      return response({success: true, message: "Manutenzione completata"});
    }
    if (action === 'deepCleanup') {
      if (!isMaster) return response({success: false, error: "Unauthorized"});
      const stats = performDeepCleanup();
      return response({success: true, stats});
    }
    return response({success: false, error: 'Invalid action'});
  } catch (err) {
    return response({success: false, error: err.toString()});
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  try {
    initSheets();
    const catalogSheet = SS.getSheetByName('CATALOG');
    const listsSheet = SS.getSheetByName('LISTS');
    const itemsSheet = SS.getSheetByName('ITEMS');
    const db = getRowsAsObjects(catalogSheet, SCHEMA['CATALOG']).filter(r => !r.DeletedAt).map(r => ({id: r.ID, normalizedName: r.Name, category: r.Category, emoji: r.Emoji, usageCount: parseInt(r.UsageCount || 0), updatedAt: parseInt(r.UpdatedAt || 0)}));
    const items = getRowsAsObjects(itemsSheet, SCHEMA['ITEMS']);
    const lists = getRowsAsObjects(listsSheet, SCHEMA['LISTS']).filter(l => !l.DeletedAt).map(l => ({id: l.ID, name: l.Name, updatedAt: parseInt(l.UpdatedAt), lockedBy: l.LockedBy || null, lockedAt: parseInt(l.LockedAt || 0), deviceName: l.DeviceName || null, items: items.filter(it => it.ListID === l.ID).map(it => ({id: it.ID, productId: it.ProductID, isChecked: it.IsChecked == 1, quantity: parseFloat(it.Quantity), unit: it.Unit, updatedAt: parseInt(it.UpdatedAt), customMetadata: it.CustomMetadata ? JSON.parse(it.CustomMetadata) : undefined, notes: it.Notes || ''}))}));
    return response({lists, db, categoryColors: JSON.parse(getConfig('categoryColors') || '{}'), emojiLibrary: JSON.parse(getConfig('emojiLibrary') || '[]'), deletedListIds: getTombstones('LISTS', 3), deletedProductIds: getTombstones('CATALOG', 6)});
  } catch (err) {return response({error: err.toString()});}
}

// --- LOGIC FUNCTIONS ---

function checkLock(listId, deviceId) {
  const sheet = SS.getSheetByName('LISTS');
  const data = sheet.getDataRange().getValues();
  const headers = SCHEMA['LISTS'];
  const byIdx = headers.indexOf('LockedBy');
  const atIdx = headers.indexOf('LockedAt');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(listId)) {
      const lockedBy = data[i][byIdx];
      const lockedAt = data[i][atIdx];
      if (!lockedBy || Date.now() - lockedAt > LOCK_TIMEOUT_MS || lockedBy === deviceId) return { canWrite: true };
      return { canWrite: false, lockedByDevice: data[i][headers.indexOf('DeviceName')] || "Altro dispositivo" };
    }
  }
  return { canWrite: true };
}

function tryAcquireLock(listId, deviceId, deviceName) {
  const sheet = SS.getSheetByName('LISTS');
  const data = sheet.getDataRange().getValues();
  const headers = SCHEMA['LISTS'];
  const byIdx = headers.indexOf('LockedBy') + 1;
  const atIdx = headers.indexOf('LockedAt') + 1;
  const devIdx = headers.indexOf('DeviceName') + 1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(listId)) {
      const currentLock = data[i][byIdx - 1];
      const currentAt = data[i][atIdx - 1];
      if (!currentLock || Date.now() - currentAt > LOCK_TIMEOUT_MS || currentLock === deviceId) {
        sheet.getRange(i + 1, byIdx).setValue(deviceId);
        sheet.getRange(i + 1, atIdx).setValue(Date.now());
        sheet.getRange(i + 1, devIdx).setValue(deviceName);
        return { success: true };
      }
      return { success: false, lockedByDevice: data[i][devIdx-1] || "Altro dispositivo" };
    }
  }
  return { success: false, error: "Lista non trovata" };
}

function tryReleaseLock(listId, deviceId) {
  const sheet = SS.getSheetByName('LISTS');
  const data = sheet.getDataRange().getValues();
  const byIdx = SCHEMA['LISTS'].indexOf('LockedBy') + 1;
  const atIdx = SCHEMA['LISTS'].indexOf('LockedAt') + 1;
  const devIdx = SCHEMA['LISTS'].indexOf('DeviceName') + 1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(listId) && data[i][byIdx - 1] === deviceId) {
      sheet.getRange(i + 1, byIdx).setValue('');
      sheet.getRange(i + 1, atIdx).setValue('');
      sheet.getRange(i + 1, devIdx).setValue('');
      return;
    }
  }
}

function saveListsSecure(listsToSave, deviceId, deviceName, isMaster) {
  const sheet = SS.getSheetByName('LISTS');
  const data = sheet.getDataRange().getValues();
  const headers = SCHEMA['LISTS'];
  const idMap = {};
  data.forEach((r, i) => idMap[String(r[0])] = i + 1);

  listsToSave.forEach(l => {
    const rIdx = idMap[String(l.id)];
    if (rIdx) {
      const row = data[rIdx - 1];
      const dbUpdatedAt = parseInt(row[headers.indexOf('UpdatedAt')] || 0);
      const dbDeletedAt = parseInt(row[headers.indexOf('DeletedAt')] || 0);

      // FIX: Se la lista è marcata come eliminata nel DB
      if (dbDeletedAt > 0) {
        // La "resuscitiamo" solo se l'update in arrivo è cronologicamente SUCCESSIVO all'eliminazione
        if (l.updatedAt > dbDeletedAt) {
          // Procedi con l'aggiornamento e pulisci il campo DeletedAt
        } else {
          // Altrimenti ignora (protezione zombie)
          return;
        }
      }

      // Se il dato sul DB è già più recente del nostro, ignora l'update
      if (dbUpdatedAt > l.updatedAt) return;

      const lockedBy = row[headers.indexOf('LockedBy')];
      let updatedRow = [l.id, l.name, l.updatedAt, '']; // DeletedAt resettato a vuoto

      if (lockedBy === deviceId) {
        updatedRow.push(deviceId, Date.now(), deviceName);
      } else {
        updatedRow.push(row[headers.indexOf('LockedBy')], row[headers.indexOf('LockedAt')], row[headers.indexOf('DeviceName')]);
      }
      sheet.getRange(rIdx, 1, 1, updatedRow.length).setValues([updatedRow]);
    } else {
      sheet.appendRow([l.id, l.name, l.updatedAt, '', '', '', '']);
    }
  });
}

// --- UTILS ---

function isAlreadyDeletedOnDB(sheetName, id, incomingUpdatedAt) {
  const data = SS.getSheetByName(sheetName).getDataRange().getValues();
  const delIdx = SCHEMA[sheetName].indexOf('DeletedAt');
  const row = data.find(r => String(r[0]) === String(id));
  if (row) {
    const dbDeletedAt = parseInt(row[delIdx] || 0);
    // Se eliminata e l'update in arrivo è più vecchio dell'eliminazione -> considerala eliminata
    if (dbDeletedAt > 0 && incomingUpdatedAt <= dbDeletedAt) return true;
  }
  return false;
}

function upsertData(sheetName, newRows) {
  const sheet = SS.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idMap = {};
  data.forEach((r, i) => idMap[String(r[0])] = i + 1);
  newRows.forEach(row => {
    const rIdx = idMap[String(row[0])];
    if (rIdx) {
      if (parseInt(row[SCHEMA[sheetName].indexOf('UpdatedAt')]) >= parseInt(data[rIdx-1][SCHEMA[sheetName].indexOf('UpdatedAt')] || 0)) {
        sheet.getRange(rIdx, 1, 1, row.length).setValues([row]);
      }
    } else sheet.appendRow(row);
  });
}

function appendData(sheetName, rows) {
  const sheet = SS.getSheetByName(sheetName);
  rows.forEach(r => sheet.appendRow(r));
}

function deleteItemsByListId(listId) {
  const sheet = SS.getSheetByName('ITEMS');
  const data = sheet.getDataRange().getValues();
  const targetId = String(listId);
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === targetId) sheet.deleteRow(i + 1);
  }
}

function markAsDeleted(sheetName, id, time) {
  const sheet = SS.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const colIdx = SCHEMA[sheetName].indexOf('DeletedAt') + 1;
  const targetId = String(id);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === targetId) {
      sheet.getRange(i + 1, colIdx).setValue(time);
      return;
    }
  }
}

function cleanupTombstones(days) {
  const limit = Date.now() - (days * 24 * 60 * 60 * 1000);
  ['LISTS', 'CATALOG'].forEach(name => {
    const sheet = SS.getSheetByName(name);
    const data = sheet.getDataRange().getValues();
    const colIdx = SCHEMA[name].indexOf('DeletedAt');
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][colIdx] && data[i][colIdx] < limit) {
        if (name === 'LISTS') deleteItemsByListId(data[i][0]);
        sheet.deleteRow(i + 1);
      }
    }
  });
}

function performDeepCleanup() {
  let stats = { listsDeleted: 0, itemsDeleted: 0, productsDeleted: 0 };
  const listSheet = SS.getSheetByName('LISTS');
  const listData = listSheet.getDataRange().getValues();
  const listIdsToDelete = [];
  for (let i = 1; i < listData.length; i++) {
    if (listData[i][SCHEMA['LISTS'].indexOf('DeletedAt')]) listIdsToDelete.push(String(listData[i][0]));
  }
  if (listIdsToDelete.length > 0) {
    const itemSheet = SS.getSheetByName('ITEMS');
    const itemData = itemSheet.getDataRange().getValues();
    for (let j = itemData.length - 1; j >= 1; j--) {
      if (listIdsToDelete.indexOf(String(itemData[j][1])) !== -1) {
        itemSheet.deleteRow(j + 1);
        stats.itemsDeleted++;
      }
    }
    for (let i = listData.length - 1; i >= 1; i--) {
      if (listData[i][SCHEMA['LISTS'].indexOf('DeletedAt')]) {
        listSheet.deleteRow(i + 1);
        stats.listsDeleted++;
      }
    }
  }
  const catSheet = SS.getSheetByName('CATALOG');
  const catData = catSheet.getDataRange().getValues();
  for (let i = catData.length - 1; i >= 1; i--) {
    if (catData[i][SCHEMA['CATALOG'].indexOf('DeletedAt')]) {
      catSheet.deleteRow(i + 1);
      stats.productsDeleted++;
    }
  }
  return stats;
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getRowsAsObjects(sheet, headers) {
  if (sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  const display = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
  return data.map((r, i) => {
    let obj = {};
    headers.forEach((h, j) => {
      if (j === 0 || j === 1) obj[h] = display[i][j];
      else obj[h] = r[j];
    });
    return obj;
  });
}

function getTombstones(sheetName, colIdx) {
  const data = SS.getSheetByName(sheetName).getDataRange().getValues();
  let tombstones = {};
  data.slice(1).forEach(r => { if (r[colIdx]) tombstones[r[0]] = r[colIdx]; });
  return tombstones;
}

function getConfig(key) {
  const data = SS.getSheetByName('CONFIG').getDataRange().getValues();
  const row = data.find(r => r[0] === key);
  return row ? row[1] : null;
}

function upsertConfig(key, value) {
  const sheet = SS.getSheetByName('CONFIG');
  const data = sheet.getDataRange().getValues();
  const rIdx = data.findIndex(r => r[0] === key) + 1;
  if (rIdx > 0) sheet.getRange(rIdx, 2).setValue(value);
  else sheet.appendRow([key, value]);
}
