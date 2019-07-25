var request = require('request'),
q = require('yapl');

module.exports = EXPA;

function EXPA(username, password, enforceSSL){
	"use strict";

	var r = request.defaults({
		rejectUnauthorized: typeof enforceSSL !== 'boolean' ? true : enforceSSL,
		jar: true,
		followAllRedirects: true,
		qsStringifyOptions: {arrayFormat: 'brackets'}
	});

	var _ = {},
	_baseUrl = 'https://gis-api.aiesec.org/v2',
	_token;

	var tokenRequest = function(){
		var deferred = q();
		
		r.get('https://auth.aiesec.org/users/sign_in', (error, response, body) => {
			var match = body.match('<meta name="csrf-token" content="(.*?)" \/\>');

			r.post({
				url: 'https://auth.aiesec.org/users/sign_in',
				form: {
					"user[email]": username,
					"user[password]": password,
					"authenticity_token": match[1],
					"commit": 'Sign in'
				}
			}, function(error, response, body){
				if(error) {
					deferred.reject(error);
				} else {
					if(body.indexOf('<h2>Invalid email or password.') > -1){
						deferred.reject('Invalid email or password');
					} else {
						response.body = body;
						deferred.resolve(response);
					}
				}
			});

		});

		return deferred;
	};

	 _.getNewToken = function() {
		return tokenRequest().then((response) => {
	 		var cookie = response.req._headers.cookie;
	 		var cookie_decoded = decodeURIComponent(cookie);
	 		var token = cookie_decoded.replace('aiesec_token=', '');
	 		token = JSON.parse(token);
	 		_token = token;
	 		return token.token.access_token;
	 	});
	};

	 _.getToken = function(){
	 	if(_token) {
	 		return q().resolve(_token);
	 	} else {
	 		return _.getNewToken();
	 	}
	 };

	_.request = function(uri, options){
		var deferred = q();
		var params = {};
		if (typeof options === 'object') {
			Object.assign(params, options, {uri: uri});
		} else if (typeof uri === 'string') {
			Object.assign(params, {uri: uri});
		} else {
			Object.assign(params, uri);
		}

		if(params.uri.indexOf('http') < 0) params.baseUrl = _baseUrl;

		params.callback = function(err, resp, body){
			if(err) {
				deferred.reject(err);
			} else {
				try{
					var json = JSON.parse(body);
					if(json.status && json.status.code == 401) {
						//if token expired, get new one and retry
						_.getNewToken().then(function(){
							_.request(uri, options)
							.then(deferred.resolve)
							.catch(deferred.reject);
						});
					} else {
						deferred.resolve(json);
					}
				} catch(e) {
					deferred.resolve(body);
				}
				
			}
		};

		_.getToken().then(function(token){
			params.uri += `?access_token=${token}`;
			r(params);
		}, deferred.reject);

		return deferred;
	};

	_.get = function(url, data){
		return _.request(url, {
			form: data
		});
	};

	_.post = function(url, data){
		return _.request(url, {
			method: "POST",
			form: data
		});
	};

	_.patch = function(url, data){
		return _.request(url, {
			method: "PATCH",
			form: data
		});
	};

	return _;
}
