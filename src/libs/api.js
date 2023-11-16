const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const { Common } = require('./common.js');

class API {
 constructor() {
  this.apiMethods = {
   get_html: this.getHTML,
   get_disk_info: this.getDiskInfo,
   get_files: this.getFiles
  };
 }

 async processAPI(name, params) {
  //console.log('API request: ', name);
  //console.log('Parameters: ', params);
  const method = this.apiMethods[name];
  if (method) return await method.call(this, params);
  else return { error: 1, message: 'API not found' };
 }

 async getHTML() {
  const dir = path.join(__dirname, '../web/html/');
  const files = (await fs.readdir(dir)).filter(file => file.endsWith('.html'));
  let html = {};
  for (const file of files) html[file.replace(/\.html$/, '')] = (await fs.readFile(path.join(dir, file), 'utf8'));
  return { error: 0, data: html };
 }

 
 async getDiskInfo(p = {}) {
  const execAsync = promisify(exec);
  try {
   const { stdout } = await execAsync('df -B1 ' + Common.settings.other.download);
   const lines = stdout.split('\n');
   const data = lines[1].split(/\s+/);
   const info = {
    total: parseInt(data[1], 10),
    used: parseInt(data[2], 10)
   };
   return { error: 0, data: info };
  } catch {
   return { error: 1, message: 'Unable to get disk info' };
  }
 }

 async getFiles(p = {}) {
  if (!p.path) return { error: 1, message: 'Path not specified' }
  const baseDir = Common.settings.other.download;
  const dir = path.join(baseDir, p.path);
  if (!dir.startsWith(baseDir)) return { error: 2, message: 'Access denied' };
  try {
   await fs.access(dir);
  } catch (err) {
   return { error: 3, message: 'Path not found' };
  }
  let items = [];
  try {
   items = await fs.readdir(dir);
  } catch {
   return { error: 4, message: 'Unknown error while reading the directory' };
  }
  const dirs = [];
  const files = [];
  for (const item of items) {
   let stats;
   try {
    stats = await fs.stat(path.join(dir, item));
   } catch {
    return { error: 5, message: 'Unknown error while file info' };
   }
   if (stats.isDirectory()) dirs.push({ name: item, modified: stats.mtime });
   if (stats.isFile()) files.push({ name: item, modified: stats.mtime, size: stats.size });
  }
  return { error: 0, data: { dirs: dirs, files: files } };
 }
}

module.exports = API;
