var expa = require('./index.js')('email@example.com', 'PassWord123');
expa.getToken().then(console.log).catch(console.log);
expa.get('current_person.json').then(console.log).catch(console.log);