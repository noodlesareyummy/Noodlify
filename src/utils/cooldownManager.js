const { Collection } = require('discord.js');
const config = require('../../config/config');
const { BlacklistDB } = require('./databaseManager');

const cooldowns = new Collection();

function isOnCooldown(userId) {
  if (isBlacklisted(userId)) {
    return true;
  }
  
  const cooldownData = cooldowns.get(userId);
  if (!cooldownData) return false;
  
  const now = Date.now();
  const cooldownEnds = cooldownData.timestamp + config.cooldownTime;
  
  return now < cooldownEnds;
}

function getRemainingCooldown(userId) {
  const cooldownData = cooldowns.get(userId);
  if (!cooldownData) return 0;
  
  const now = Date.now();
  const cooldownEnds = cooldownData.timestamp + config.cooldownTime;
  
  if (now >= cooldownEnds) {
    return 0;
  }
  
  return Math.ceil((cooldownEnds - now) / 1000);
}

function setCooldown(userId, reason = 'Verification denied') {
  cooldowns.set(userId, {
    timestamp: Date.now(),
    reason
  });
}

function blacklistUser(userId, reason = 'Blacklisted by staff', staffId = null) {
  BlacklistDB.add(userId, reason, staffId);
  return true;
}

function removeBlacklist(userId) {
  return BlacklistDB.remove(userId);
}

function isBlacklisted(userId) {
  return BlacklistDB.isBlacklisted(userId);
}

function getBlacklistReason(userId) {
  return BlacklistDB.getReason(userId);
}

function getAllBlacklisted() {
  const blacklist = BlacklistDB.getAll();
  
  const collection = new Collection();
  
  for (const [userId, data] of Object.entries(blacklist)) {
    collection.set(userId, data);
  }
  
  return collection;
}

module.exports = {
  isOnCooldown,
  getRemainingCooldown,
  setCooldown,
  blacklistUser,
  removeBlacklist,
  isBlacklisted,
  getBlacklistReason,
  getAllBlacklisted
};