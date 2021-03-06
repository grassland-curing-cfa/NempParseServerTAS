// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var cors = require('cors');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var S3Adapter = require('parse-server').S3Adapter;

var S3AccessKey = process.env.S3_ACCESS_KEY;
var S3SecretKey = process.env.S3_SECRET_KEY;
var S3Bucket = process.env.S3_BUCKET_NAME;

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  restAPIKey: process.env.REST_API_KEY || '',
  javascriptKey: process.env.JAVASCRIPT_KEY || '',
  fileKey: process.env.FILE_KEY || 'myFileKey',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: [] // List of classes to support for query subscriptions
  },
  publicServerURL: process.env.SERVER_URL,
  filesAdapter: new S3Adapter(
    S3AccessKey,
    S3SecretKey,
    S3Bucket,
    {directAccess: true,
     region: 'ap-southeast-1'}
  ),
  
  //Enable email verification
  verifyUserEmails: true,
  preventLoginWithUnverifiedEmail: false, // defaults to false
  //Your apps name. This will appear in the subject and body of the emails that are sent.
  appName: process.env.APP_NAME,
  // The email adapter
  emailAdapter: {
    module: '@parse/simple-mailgun-adapter',
    options: {
      // The address that your emails come from
      fromAddress: process.env.EMAIL_ADDR_CFA_NEMP,
      // Your domain from mailgun.com
      domain: process.env.MG_DOMAIN,
      // Your API key from mailgun.com
      apiKey: process.env.MG_KEY
    }
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();
app.use(cors());

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
