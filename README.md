# node-gis-wrapper
A node module for easy interaction with the EXPA API.

There are methods for conveniently using the EXPA REST API.
It automatically gets an access token for you, uses it with requests and refreshes it if necessary. So you do not have to worry about it.

Example:

```javascript
var expa = require('node-gis-wrapper')('expa_user@email.com', 'password');
expa.get('current_person.json').then(console.log).catch(console.log);
```

