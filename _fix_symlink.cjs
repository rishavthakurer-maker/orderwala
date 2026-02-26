// Monkey-patch fs.symlink to copy directories instead of creating symlinks/junctions.
// This ensures the deployed zip contains real files, not Windows junctions
// that break on Linux (Cloud Run).
const fs = require('fs');
const path = require('path');

const _symlink = fs.symlink;
fs.symlink = function(target, linkPath, typeOrCb, cb) {
  if (typeof typeOrCb === 'function') { cb = typeOrCb; typeOrCb = undefined; }
  cb = cb || function(){};
  // Resolve target relative to linkPath's directory
  const resolvedTarget = path.isAbsolute(target)
    ? target
    : path.resolve(path.dirname(linkPath), target);
  try {
    fs.cpSync(resolvedTarget, linkPath, { recursive: true });
    cb(null);
  } catch (err) {
    // Fallback to junction if copy fails
    _symlink.call(fs, target, linkPath, 'junction', cb);
  }
};

const _symlinkSync = fs.symlinkSync;
fs.symlinkSync = function(target, linkPath, type) {
  const resolvedTarget = path.isAbsolute(target)
    ? target
    : path.resolve(path.dirname(linkPath), target);
  try {
    fs.cpSync(resolvedTarget, linkPath, { recursive: true });
  } catch (err) {
    return _symlinkSync.call(fs, target, linkPath, 'junction');
  }
};