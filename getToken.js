var expa = require('./index.js')('email@example.com', 'PassWord123');
expa.getToken().then(console.log).catch(console.log);
