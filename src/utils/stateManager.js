const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const statePath = path.join(dataDir, 'botState.json');

const defaultState = {
  verificationEnabled: true,
  lastUpdated: new Date().toISOString()
};

function loadState() {
  try {
    if (fs.existsSync(statePath)) {
      const data = fs.readFileSync(statePath, 'utf8');
      return JSON.parse(data);
    } else {
      saveState(defaultState);
      return defaultState;
    }
  } catch (error) {
    console.error('Error loading state:', error);
    return defaultState;
  }
}

function saveState(state) {
  try {
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving state:', error);
    return false;
  }
}

function getStateValue(key) {
  const state = loadState();
  return state[key];
}

function setStateValue(key, value) {
  const state = loadState();
  state[key] = value;
  return saveState(state);
}

module.exports = {
  loadState,
  saveState,
  getStateValue,
  setStateValue
};