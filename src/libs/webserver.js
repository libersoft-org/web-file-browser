const fs = require('fs');
const path = require('path');
const { Elysia } = require('elysia');
const API = require('./api.js');
const { Common } = require('./common.js');

class WebServer {
 async run() {
  try {
   this.api = new API();
   await this.startServer();
  } catch (ex) {
   Common.addLog('Cannot start web server.', 2);
   Common.addLog(ex, 2);
  }
 }

 async startServer() {
  const app = new Elysia()
   .onRequest((req) => {
    let url = '/' + req.request.url.split('/').slice(3).join('/');
    Common.addLog(req.request.method + ' request from: ' + req.request.headers.get('cf-connecting-ip') + ' (' + (req.request.headers.get('cf-ipcountry') + ')') + ', URL: ' + url);
   })
   .post('/api/:name', async (req) => this.getAPI(req))
   .get('/download/*', async (req) => this.getDownload(req))
   .get('/*', async (req) => this.getFile(req));
  const server = { fetch: app.fetch };
  if (Common.settings.web.standalone) server.port = Common.settings.web.port;
  else server.unix = Common.settings.web.socket_path;
  Bun.serve(server);
  if (!Common.settings.web.standalone) fs.chmodSync(Common.settings.web.socket_path, '777');
  Common.addLog('Web server is running on ' + (Common.settings.web.standalone ? 'port: ' + Common.settings.web.port : 'Unix socket: ' + Common.settings.web.socket_path));
 }

 async getAPI(req) {
  return new Response(JSON.stringify(await this.api.processAPI(req.params.name, req.body)), { headers: { 'Content-Type': 'application/json' }})
 }

 async getDownload(req) {
  if (!req.params['*']) return this.getIndex(req);
  const file = Bun.file(decodeURIComponent(path.join(Common.settings.other.download, req.params['*'])));
  if (!await file.exists()) return this.getIndex(req);
  return new Response(file, {
   headers: {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment'
   }
  });
 }

 async getIndex(req) {
  const content = await Bun.file(path.join(__dirname, '../web/index.html')).text();
  return new Response(Common.translate(content, {
   '{TITLE}': Common.settings.web.name,
   '{DESCRIPTION}': Common.settings.web.description
  }), { headers: { 'Content-Type': 'text/html' }});
 }

 async getFile(req) {
  const file = Bun.file(path.join(__dirname, '../web/', req.path));
  if (!await file.exists()) return this.getIndex(req);
  else return new Response(file);
 };
}

module.exports = WebServer;
