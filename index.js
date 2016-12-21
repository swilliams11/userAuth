var express = require('express'),
    exphbs  = require('express-handlebars'),
    passport = require('passport'),
    Q = require('q'),
    OAuth2Strategy = require('passport-oauth2'),
    LocalStrategy = require('passport-local'),
    TwitterStrategy = require('passport-twitter'),
    GoolgeStrategy = require('passport-google'),
    FacebookStrategy = require('passport-facebook'),
    http = require('http'),
    https = require('https'),
    async = require('async');


var config = require('./config.js'), //config file contains all tokens and other private info
    funct = require('./functions.js');
var org = config.org,
    env = config.env,
    apigeeDomain = config.apigeeDomain,
    clientId = config.clientId,
    callbackUrl = config.callbackUrl;

var app = express();
var globalAccessToken;

//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("deserializing " + obj);
  done(null, obj);
});

//use the oauth2 strategy with Passport to login users
passport.use(new OAuth2Strategy({
    authorizationURL: 'https://' + org + '-' + env + apigeeDomain + '/android-oauth/authorize',
    tokenURL: 'https://' + org + '-' + env + apigeeDomain + '/android-oauth/token',
    clientID: clientId,
    clientSecret: 'secret',
    callbackURL: callbackUrl
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(accessToken);
    console.log(profile);
    globalAccessToken = accessToken;
    User.findOrCreate({ exampleId: profile.id }, function (err, user) {
      console.log('access token: ' + accessToken);
      console.log('profile: ' + profile);
      return cb(err, user);
    });
  }
));


//get an access token
//waits for response - synchronous
function getToken(reql, resl){
  console.log('getToken()...');
  async.parallel([
    function(callback) {
      var options = {
        hostname: org + '-' + env + apigeeDomain,
        port: 443,
        path: '/android-oauth/token?response_type=token&client_id=' + clientId + '&redirect_uri=' + callbackUrl,
        method: 'POST'
      };
      var tokereq = https.request(options, (tokenres) => {
        console.log('statusCode:', tokenres.statusCode);
        console.log('headers:', tokenres.headers);
        console.log(JSON.stringify('{"statusCode":' + tokenres.statusCode + ', "headers":' +  tokenres.headers+ '}'));
        //callback(false, JSON.stringify('{"statusCode":' + tokenres.statusCode + ', "headers":' +  tokenres.headers+ '}'));
        var array = [tokenres.statusCode, tokenres.headers];
        callback(false, array);

        tokenres.on('data', (d) => {
          process.stdout.write(d);
          console.log(tokenres.headers);
        });
      });

      tokereq.end(); //send the request

      tokereq.on('error', (e) => {
        console.error(e);
        callback(true);
        return;
      });
    }
  ],
  /*
   * Collate results
   */
  function(err, results) {
    if(err) {
      console.log(err);
      resl.send(500,"Server Error");
      return;
    }
    console.log('sending the response data...');
    console.log(results[0]);
    var statusCode = results[0][0];
    var statusHeaders = results[0][1];
    console.log('response code:' + statusCode);
    console.log('headers: ' + statusHeaders);
    var token = extractToken(statusHeaders);
    //resl.set('x-token', token);
    //resl.set('Location', statusHeaders.location);
    console.log('setting x-token to: ' + token);
    //resl.status(statusCode);
    resl.end();
    //resl.writeHead(statusCode, statusHeaders);
    //resl.send();
    //resl.writeHead(results.statusCode, results.headers);
  }
  );
}

/*
This uses deferred promise
*/
function getTokenDeferred(reql, resl){
  console.log('getTokenDeferred()...');
  var deferred = Q.defer();

  var options = {
    hostname: org + '-' + env + apigeeDomain,
    port: 443,
    path: '/android-oauth/token?response_type=token&client_id=' + clientId + '&redirect_uri=' + callbackUrl,
    method: 'POST'
  };
  var tokereq = https.request(options, (tokenres) => {
    console.log('statusCode:', tokenres.statusCode);
    console.log('headers:', tokenres.headers);
    console.log(JSON.stringify('{"statusCode":' + tokenres.statusCode + ', "headers":' +  tokenres.headers+ '}'));
    //callback(false, JSON.stringify('{"statusCode":' + tokenres.statusCode + ', "headers":' +  tokenres.headers+ '}'));
    var array = [tokenres.statusCode, tokenres.headers];
    deferred.resolve(tokenres);
  });

  tokereq.on('error', (e) => {
    console.error(e);
    deferred.resolve(false);
    return;
  });

  tokereq.end(); //send the request

  return deferred.promise;

/*
    console.log('sending the response data...');
    console.log(results[0]);
    var statusCode = results[0][0];
    var statusHeaders = results[0][1];
    console.log('response code:' + statusCode);
    console.log('headers: ' + statusHeaders);
    var token = extractToken(statusHeaders);
    console.log('setting x-token to: ' + token);
    resl.end();
*/
}

function extractToken(headers) {
  console.log('extractToken()...');
  console.log(headers.location);
  var tokenParam = headers.location.match(/access_token=.*/);
  if(tokenParam != null){
    console.log('token is: ' + tokenParam[0].split("=")[1]);
    globalAccessToken = tokenParam[0].split("=")[1];
    return tokenParam[0].split("=")[1];
  } else {
    //TODO extract the error code from here.
    return null;
  }
}


//get an access token - asyncrhonously
function getTokenASync(reql, resl){
  console.log('getTokenASync()...');
  var options = {
    hostname: org + '-' + env + apigeeDomain,
    port: 443,
    path: '/android-oauth/token?response_type=token&client_id=' + clientId + '&redirect_uri=' + callbackUrl,
    method: 'POST'
  };
  var tokereq = https.request(options, (tokenres) => {
    console.log('statusCode:', tokenres.statusCode);
    console.log('headers:', tokenres.headers);
    console.log(JSON.stringify('{"statusCode":' + tokenres.statusCode + ', "headers":' +  tokenres.headers+ '}'));
    //callback(false, JSON.stringify('{"statusCode":' + tokenres.statusCode + ', "headers":' +  tokenres.headers+ '}'));
    var token = extractToken(tokenres.headers);
    console.log('setting x-token to: ' + token);
    console.log('location header is: ' + tokenres.headers.location);
    resl.set('x-token', token );
    resl.set('Location', tokenres.headers.location);
    resl.status(tokenres.statusCode);
    //resl.writeHead(tokenres.statusCode, tokenres.headers);
    resl.end();
    //resl.send();

    /*tokenres.on('data', (d) => {
      process.stdout.write(d);
      console.log(tokenres.headers);
    });*/
  });

  tokereq.end(); //send the request

  tokereq.on('error', (e) => {
    console.error(e);
    return;
  });
}



// Use the LocalStrategy to login local users.
//it also calls out to obtain an access token.
passport.use('local-signin-oauth', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localAuth(username, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        req.session.success = 'You are successfully logged in ' + user.username + '!';
        //callout to get an access token - should we call getToken here?
        //getToken();
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));


// Use the LocalStrategy to login local users.
//it also calls out to obtain an access token.
passport.use('local-signin-oauth-implicit', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localAuth(username, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        req.session.success = 'You are successfully logged in ' + user.username + '!';
        //callout to get an access token - should we call getToken here?
        getToken();
        console.log('getToken() finished!');
        //done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));


// Use the LocalStrategy within Passport to login users.
passport.use('local-signin', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localAuth(username, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        req.session.success = 'You are successfully logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));

// Use the LocalStrategy within Passport to Register/"signup" users.
passport.use('local-signup', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localReg(username, password)
    .then(function (user) {
      if (user) {
        console.log("REGISTERED: " + user.username);
        req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT REGISTER");
        req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.error = 'Please sign in!';
  res.redirect('/signin');
}


//===============EXPRESS=================

// Configure Express
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'supernova' }));
app.use(passport.initialize());
app.use(passport.session());

// Session-persisted message middleware
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

app.use(app.router);

// Configure express to use handlebars templates
var hbs = exphbs.create({
    defaultLayout: 'main',
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


//===============ROUTES=================
//displays our homepage
app.get('/', function(req, res){
  res.render('home', {user: req.user, token: globalAccessToken});
});

//this uses the oauth2 strategy
app.get('/auth/provider',
  passport.authenticate('oauth2'));

//displays our signup page
app.get('/signin', function(req, res){
  res.render('signin');
});

app.get('/signinoauth', function(req, res){
  res.render('signinoauth');
});

app.get('/signinoauthimplicit', function(req, res){
  res.render('signinoauthimplicit');
});


//displays our signup page
app.get('/signin-edge', function(req, res){
  //res.render('signin');
  https.get('https://' + org + '-' + env + apigeeDomain + '/android-oauth/authorize?response_type=token&client_id=' + clientId + '&redirect_uri=' + callbackUrl, function(reslocal){
       var str = '';
       console.log('Response is '+reslocal.statusCode);
       console.log('Response headers: ' + reslocal.headers);

       reslocal.on('data', function (chunk) {
             //console.log('BODY: ' + chunk);
              str += chunk;
        });

       reslocal.on('end', function () {
            res.set(reslocal.headers);
            res.status(reslocal.statusCode);
            res.send();
            console.log("on end...");
            console.log(reslocal.headers);
            console.log(str);
       });

       reslocal.on('error', (e) => {
         res.set(reslocal.headers);
         res.status(reslocal.statusCode);
         res.send(reslocal.body);
         console.log(`problem with request: ${e.message}`);
         console.log(e);
       });
 });
});


//implicit grant - send request to /authorize endpoint point.
app.get('/signin-implicit', function(req, res){
  //res.render('signin');
  //send request to authorize endpoint which redirects user to /signinoauthimplicit
  https.get('https://' + org + '-' + env + apigeeDomain + '/android-oauth/authorize?response_type=token&client_id=' + clientId + '&redirect_uri=' + callbackUrl, function(reslocal){
       var str = '';
       console.log('Response is '+reslocal.statusCode);
       console.log('Response headers: ' + reslocal.headers);

       reslocal.on('data', function (chunk) {
             //console.log('BODY: ' + chunk);
              str += chunk;
        });

       reslocal.on('end', function () {
            res.set(reslocal.headers);
            res.status(reslocal.statusCode);
            res.send();
            console.log("on end...");
            console.log(reslocal.headers);
            console.log(str);
       });

       reslocal.on('error', (e) => {
         res.set(reslocal.headers);
         res.status(reslocal.statusCode);
         res.send(reslocal.body);
         console.log(`problem with request: ${e.message}`);
         console.log(e);
       });
 });
});


//This is the callback URL which receives the token. Original ...
app.get('/callback', function(req, res){
  var location = res.get('Location');
  console.log(location);
  var tokenParam = location.match(/access_token=.*/);
  if(tokenParam != null){
    console.log('token is: ' + tokenParam[0].split("=")[1]);
    var token = tokenParam[0].split("=")[1];
  } else {
    res.render('signinoauth');
  }
});


// The OAuth provider has redirected the user back to the application.
// Finish the authentication process by attempting to obtain an access
// token.  If authorization was granted, the user will be logged in.
// Otherwise, authentication has failed.
app.all('/callback/auth2',
  function(req, res){
    console.log("/callback/auth2 endpoint....")
    getTokenDeferred(req, res)
      .then(function(defres){
        console.log('getTokenDeferred() has responded...');
        var statusCode = defres.statusCode;
        var locationHeader = defres.headers.location;
        console.log('response code:' + statusCode);
        console.log('Location: ' + locationHeader);
        var token = extractToken(defres.headers);
        globalAccessToken = token;
        console.log('request url:' + req.url);
         var tokenParam = token;
         if(tokenParam != null){
           user = app.get('User');
           console.log(user);
           res.render('home', {user: app.get('User'), token: tokenParam});
         } else {
           res.render('signinoauthimplicit');
         }

      })
      .fail(function(err){
        console.log("getTokenDeferred() FAILED!");
        console.log(err.body);
        //res.end();
      });
});


//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);

//sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/login', passport.authenticate('local-signin', {
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);

//send the request through oauth - redirects user to /authorize endpoint
//this only uses the authorization code flow.
app.post('/loginoauth', passport.authenticate('local-signin-oauth', {
  successRedirect: '/',
  failureRedirect: '/signinoauth'
  })
);


//send the request through oauth - redirects user to /authorize endpoint
//this uses the implicit grant flow but the passport request
//intercepts the request so the /callback function is never called
/*
app.post('/loginoauthimplicit', passport.authenticate('local-signin-oauth-implicit', {
  successRedirect: '/',
  failureRedirect: '/signinoauthimplicit'
  })
);
*/

//authenticates the user then redirect to /callback/auth2
//
app.post('/loginoauthimplicit', function(req, res){
  console.log('username: ' + req.body.username +  ' password: ' + req.body.password);
  funct.localAuth(req.body.username, req.body.password)
  .then(function (user) {
    if (user) {
      console.log("LOGGED IN AS: " + user.username);
      req.session.success = 'You are successfully logged in ' + user.username + '!';
      app.set('User', user);
      //callout to get an access token - should we call getToken here?
      //getTokenASync(req, res);
      //getToken(req, res);
      res.redirect("/callback/auth2");
      console.log('getToken() finished!');
      //res.redirect(tokenResponse);
      //res.redirect("/")
    }
    if (!user) {
      console.log("COULD NOT LOG IN");
      req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
      res.redirect("/signinoauthimplicit");
    }
  })
  .fail(function (err){
    console.log(err.body);
  });


   //var location = res.get('Location');
   //console.log(location);
   //var tokenParam = location.match(/access_token=.*/);
   //if(tokenParam != null){
  //   console.log('token is: ' + tokenParam[0].split("=")[1]);
  //   var token = tokenParam[0].split("=")[1];
  //   globalAccessToken = token;
  //   res.redirect('/');
   //} else {
    // res.render('signinoauthimplicit');
   //}

}
);



//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGIN OUT " + req.user.username)
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

var server_port = process.env.NODE_PORT || 3000
var server_ip_address = process.env.NODE_IP || 'localhost'
//===============PORT=================
//var port = process.env.PORT || 5000;
app.listen(server_port, server_ip_address);
console.log("listening on " + server_port + "!");
