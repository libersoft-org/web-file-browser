const f = new Framework();
const showDiskInfo = true;
let pageName;
let dirCurrent = location.pathname;
let files;

window.onload = async () => {
 document.addEventListener('page-loaded', () => getPageContent());
 pageName = document.title;
 await f.init();
};

async function getPageContent() {
 dirCurrent = location.pathname;
 f.qs('.loader').style.setProperty('display', 'block');
 if (showDiskInfo) {
  f.qs('#content .data').innerHTML = '';
  const diskInfo = (await f.getAPI('get_disk_info')).data;
  f.qs('#content .disk').innerHTML = f.translate(f.getHTML('disk'), {
   '{PERCENT}': ((diskInfo.used / diskInfo.total) * 100).toFixed(2),
   '{USED}': getHumanSize(diskInfo.used),
   '{FREE}': getHumanSize(diskInfo.total - diskInfo.used),
   '{TOTAL}': getHumanSize(diskInfo.total)
  });
 }
 files = await f.getAPI('get_files', { path: decodeURIComponent(dirCurrent) });
 await showFiles();
}

function getFile(link) {
 window.location.href = '/download' + link;
}

async function showFiles() {
 document.title = pageName + ' - ' + decodeURIComponent(dirCurrent);
 f.qs('#content .data').innerHTML = '';
 f.qs('.loader').style.setProperty('display', 'block');
 if (files.error != 0) f.qs('#content .data').innerHTML = f.translate(f.getHTML('error'), { '{ERROR}': files.message });
 else {
  if (!localStorage.getItem('sort')) localStorage.setItem('sort', 'name');
  if (!localStorage.getItem('order')) localStorage.setItem('order', false);
  const sort = localStorage.getItem('sort');
  const order = localStorage.getItem('order') == 'true' ? true : false;
  files.data.dirs = sortArray(files.data.dirs, sort != 'size' ? sort : 'name', order);
  files.data.files = sortArray(files.data.files, sort, order);
  let rows = '';
  const item = await f.getHTML('item');
  if (dirCurrent != '/') {
   let path = dirCurrent.slice(0, -1);
   path = path.substring(0, path.lastIndexOf('/'));
   rows += f.translate(item, {
   '{LINK}': 'f.getPage(\'' + path + '/\')',
   '{NAME}': '&#128193; ..',
   '{DATE}': '',
   '{SIZE}': ''
   });
  }
  for (const dir of files.data.dirs) {
   rows += f.translate(item, {
    '{LINK}': 'f.getPage(\'' + dirCurrent + encodeURIComponent(dir.name) + '/\')',
    '{NAME}': '&#128193; ' + dir.name,
    '{DATE}': new Date(dir.modified).toLocaleString(),
    '{SIZE}': ''
   });
  }
  for (const file of files.data.files) {
   rows += f.translate(item, {
    '{LINK}': 'getFile(\'' + dirCurrent + encodeURIComponent(file.name) + '\')',
    '{NAME}': '&#128196; ' + file.name,
    '{DATE}': new Date(file.modified).toLocaleString(),
    '{SIZE}': getHumanSize(file.size)
   });
  }
  f.qs('#content .data').innerHTML = f.translate(f.getHTML('files'), {
   '{DIR}': dirCurrent,
   '{ORDER-NAME}': sort == 'name' ? !order : false,
   '{ORDER-DATE}': sort == 'modified' ? !order : false,
   '{ORDER-SIZE}': sort == 'size' ? !order : false,
   '{ORDER-NAME-ICON}': sort == 'name' && !order ? '&#9650;' : '&#9660;',
   '{ORDER-DATE-ICON}': sort == 'modified' && !order ? '&#9650;' : '&#9660;',
   '{ORDER-SIZE-ICON}': sort == 'size' && !order ? '&#9650;' : '&#9660;',
   '{ROWS}': rows
  });
 }
 f.qs('.loader').style.setProperty('display', 'none');
}

async function sort(sort, order) {
 localStorage.setItem('sort', sort);
 localStorage.setItem('order', order);
 await showFiles();
}

function sortArray(array, sort = 'name', order = false) {
 return array.sort((a, b) => {
  switch (sort) {
   case 'name':
    return order ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
   case 'modified':
    let dateA = new Date(a.modified), dateB = new Date(b.modified);
    return order ? dateB - dateA : dateA - dateB;
   case 'size':
    return order ? b.size - a.size : a.size - b.size;
  }
 });
}

function getHumanSize(bytes) {
 if (bytes === undefined || bytes === null) return null;
 const units = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
 let i = 0;
 while (bytes >= 1024 && i < units.length - 1) {
  bytes /= 1024;
  i++;
 }
 return bytes.toFixed(2) + ' ' + units[i] + 'B';
}
