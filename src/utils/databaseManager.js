const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPaths = {
  applications: path.join(dataDir, 'applications.json'),
  history: path.join(dataDir, 'history.json'),
  blacklist: path.join(dataDir, 'blacklist.json'),
  images: path.join(dataDir, 'imageCache')
};

if (!fs.existsSync(dbPaths.images)) {
  fs.mkdirSync(dbPaths.images, { recursive: true });
}

const defaultDbs = {
  applications: {},
  history: {},
  blacklist: {}
};

function initializeDatabase() {
  for (const [key, filePath] of Object.entries(dbPaths)) {
    if (key === 'images') continue;
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultDbs[key], null, 2), 'utf8');
      console.log(`Created database file: ${filePath}`);
    }
  }
}

function loadDatabase(dbName) {
  try {
    const filePath = dbPaths[dbName];
    if (!filePath || !fs.existsSync(filePath)) {
      return defaultDbs[dbName] || {};
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${dbName} database:`, error);
    return defaultDbs[dbName] || {};
  }
}

function saveDatabase(dbName, data) {
  try {
    const filePath = dbPaths[dbName];
    if (!filePath) return false;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving ${dbName} database:`, error);
    return false;
  }
}

const ApplicationDB = {
  getAll: () => loadDatabase('applications'),
  
  get: (applicationId) => {
    const db = loadDatabase('applications');
    return db[applicationId] || null;
  },
  
  save: (application) => {
    if (!application.applicationId) return false;
    
    const db = loadDatabase('applications');
    db[application.applicationId] = application;
    return saveDatabase('applications', db);
  },
  
  update: (applicationId, updates) => {
    const db = loadDatabase('applications');
    if (!db[applicationId]) return false;
    
    db[applicationId] = { ...db[applicationId], ...updates };
    return saveDatabase('applications', db);
  },
  
  delete: (applicationId) => {
    const db = loadDatabase('applications');
    if (!db[applicationId]) return false;
    
    delete db[applicationId];
    return saveDatabase('applications', db);
  },
  
  findByUser: (userId) => {
    const db = loadDatabase('applications');
    return Object.values(db).filter(app => app.userId === userId);
  }
};

const HistoryDB = {
  getAll: () => loadDatabase('history'),
  
  getByUser: (userId) => {
    const db = loadDatabase('history');
    return Object.values(db).filter(entry => entry.userId === userId);
  },
  
  getByApplication: (applicationId) => {
    const db = loadDatabase('history');
    return Object.values(db).filter(entry => entry.applicationId === applicationId);
  },
  
  add: (entry) => {
    if (!entry.id) {
      entry.id = `${entry.userId}_${Date.now()}`;
    }
    
    const db = loadDatabase('history');
    db[entry.id] = entry;
    return saveDatabase('history', db);
  },
  
  getRecent: (limit = 10) => {
    const db = loadDatabase('history');
    return Object.values(db)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
};

const BlacklistDB = {
  getAll: () => loadDatabase('blacklist'),
  
  isBlacklisted: (userId) => {
    const db = loadDatabase('blacklist');
    return !!db[userId];
  },
  
  add: (userId, reason, staffId) => {
    const db = loadDatabase('blacklist');
    db[userId] = {
      userId,
      reason,
      staffId,
      timestamp: Date.now()
    };
    return saveDatabase('blacklist', db);
  },
  
  remove: (userId) => {
    const db = loadDatabase('blacklist');
    if (!db[userId]) return false;
    
    delete db[userId];
    return saveDatabase('blacklist', db);
  },
  
  getReason: (userId) => {
    const db = loadDatabase('blacklist');
    return db[userId]?.reason || null;
  }
};

const ImageCache = {
  saveImage: async (url, applicationId) => {
    try {
      if (!url || !applicationId) return url;
      
      const urlHash = crypto.createHash('md5').update(url).digest('hex');
      const fileExtension = url.split('.').pop().split('?')[0];
      const fileName = `${applicationId}_${urlHash}.${fileExtension}`;
      const filePath = path.join(dbPaths.images, fileName);
      
      if (fs.existsSync(filePath)) {
        console.log(`Image already cached: ${fileName}`);
        return filePath;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      
      const buffer = await response.buffer();
      fs.writeFileSync(filePath, buffer);
      
      const imgDb = loadDatabase('applications');
      if (imgDb[applicationId]) {
        imgDb[applicationId].cachedImageUrl = filePath;
        saveDatabase('applications', imgDb);
      }
      
      console.log(`Cached image: ${fileName}`);
      return filePath;
    } catch (error) {
      console.error('Error caching image:', error);
      return url;
    }
  },
  
  getImagePath: (applicationId) => {
    try {
      const imgDb = loadDatabase('applications');
      return imgDb[applicationId]?.cachedImageUrl || null;
    } catch (error) {
      console.error('Error getting cached image path:', error);
      return null;
    }
  }
};

initializeDatabase();

module.exports = {
  ApplicationDB,
  HistoryDB,
  BlacklistDB,
  ImageCache
};