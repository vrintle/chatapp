let http = require('http'),
    fs = require('fs'),
    path = require('path');

let rExt = /(?<=\.).+$/g
let rComma = /(?<=^|\})\,(?=\{|$)/g
let mimeMap = {
  'html': 'text/html',
  'js': 'text/javascript',
  'css': 'text/css',
  'json': 'application/json',
  'png': 'image/png',
  'jpg': 'image/jpg',
  'ico': 'image/x-icon'
};
// console.log('hello')

http.createServer((req, resp) => {
  if(req.method === 'GET') {
    req.url = req.url === '/' ? '/views/index.html' : '/public' + req.url;
    let ext = req.url.match(rExt)[0];
    console.log(req.method, ext);

    fs.readFile('.' + req.url, (err, res) => {
      resp.writeHead('200', { 'Content-Type': mimeMap[ext] });
      resp.end(res, 'utf8');
    });
  } else if(req.method === 'POST') {
    req.on('data', chunk => {
      console.log('len', chunk.length);
      let chunk2 = JSON.parse(chunk);
      if(chunk2.task === 'load_chats') {
        fs.readFile('./public/chats.txt', (err, data) => {
          let str = data.toString();
          // console.log(str);
          resp.writeHead('200', { 'Content-Type': 'text/plain' });
          resp.end(`{"chats":[${ str.substring(0, str.length-1) }],"task":"load_chats"}`);
        });
      } else if(chunk2.task === 'save_chat' || chunk2.task === 'save_mms') {
        if(chunk2.task === 'save_mms') {
          fs.writeFile('./public/bin/i' + chunk2.timeStamp + '.png', Buffer.from(chunk2.imgURL, 'base64'), err => {});
          chunk2.imgURL = './bin/i' + chunk2.timeStamp + '.png';
        }
        
        chunk2 = JSON.stringify(chunk2);
        fs.appendFile('./public/chats.txt', chunk2 + ',', 'utf8', err => {
          resp.writeHead('200', { 'Content-Type': 'text/plain' });
          resp.end(chunk2);
        });
      } else if(chunk2.task === 'save_vote') {
        fs.readFile('./public/chats.txt', (err, data) => {
          let str = data.toLocaleString();
          // console.log(str[str.length-2])
          let chats = JSON.parse(`[${ str.substring(0, str.length-1) }]`);
          let idx = chats.findIndex(chat => chat.timeStamp === chunk2.timeStamp);
          chats[idx].voters.push(chunk2.voter);
          str = JSON.stringify(chats);
          fs.writeFile('./public/chats.txt', str.substring(1, str.length-1) + ',', err => {
            resp.writeHead('200', { 'Content-Type': 'text/plain' });
            resp.end(chunk);
          })
        });
      }
    });
  }
}).listen(8080);