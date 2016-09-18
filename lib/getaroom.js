var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

function helloRoute() {
  var hello = new express.Router();
  hello.use(cors());
  hello.use(bodyParser());


  // GET REST endpoint - query params may or may not be populated
  hello.get('/', function(req, res) {
    console.log(new Date(), 'In hello route GET / req.query=', req.query);

    var fs = require('fs');
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');
    var objResults = [];

    // If modifying these scopes, delete your previously saved credentials
    // at ~/.credentials/calendar-nodejs-quickstart.json
    var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
    var TOKEN_PATH = './calendar-nodejs-quickstart.json';
    
    // Load client secrets from a local file.
    fs.readFile('./client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the
      // Google Calendar API.
      authorize(JSON.parse(content), getCalendars);
    });
    

    function getCalendars(auth) {
      console.log('here i am in getCalendars');

      // Kiosk
      listEvents(auth, 'redhat.com_3839333536373238383530@resource.calendar.google.com');

      // Reg
      listEvents(auth, 'redhat.com_3531323537362d383937@resource.calendar.google.com');

      // Tower
      listEvents(auth, 'redhat.com_35383931393239312d373730@resource.calendar.google.com')

      // Suir
      listEvents(auth, 'redhat.com_3535343938363431363036@resource.calendar.google.com')
    }


    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
      var clientSecret = credentials.installed.client_secret;
      var clientId = credentials.installed.client_id;
      var redirectUrl = credentials.installed.redirect_uris[0];
      var auth = new googleAuth();
      var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    
      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
          console.log('unable to find ' + TOKEN_PATH);
        } else {
          oauth2Client.credentials = JSON.parse(token);
          callback(oauth2Client);
        }
      });
    }
    
    function ISODateString(d){
     function pad(n){return n<10 ? '0'+n : n}
     return d.getUTCFullYear()+'-'
          + pad(d.getUTCMonth()+1)+'-'
          + pad(d.getUTCDate())+'T'
          + pad(d.getUTCHours() + 1)+':'
          + pad(d.getUTCMinutes())+':'
          + pad(d.getUTCSeconds())+'+01:00'
        }

    /**
     * Append a pre element to the body containing the given message
     * as its text node.
     *
     * @param {string} message Text to be placed in pre element.
     */
    function appendPre() {

      if (objResults.length >= 4) {
        // All rooms have been processed, now sort based on rank
        objResults.sort(function (a, b) {
          if (a.rank < b.rank) {
            return 1;
          }
          if (a.rank > b.rank) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });

        res.json(objResults);
        
      }
    }

    /**
     * Lists the next event in the calendar.
     *
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client
     * calId - id of the calendar (available form the calendar settings).
     */
    function listEvents(auth, calId) {
      var calendar = google.calendar('v3');

      calendar.events.list({
        auth: auth,
        calendarId: calId,
        timeMin: (new Date()).toISOString(),
        maxResults: 1,
        singleEvents: true,
        orderBy: 'startTime'
      }, function(err, response) {
          var events = response.items;

          if (events.length > 0) {
            for (i = 0; i < events.length; i++) {
              var event = events[i];

              var d1 = new Date ();
              var d2 = new Date ( d1 );
              d2.setHours ( d1.getHours() + 1 );

              var currTime = d2.toISOString();
              console.log('current time is ' + currTime);
              console.log('start time for ' + response.summary + ' is ' + event.start.dateTime);
              console.log('end time is ' + response.summary + ' is '+ event.end.dateTime);

              var midnight = new Date();
              midnight.setDate(midnight.getDate() + 1)

              //Convert to midnight in your timezone first
              midnight.setHours(0,0,0,0);

              //Convert to midnight UTC
              midnight.setUTCHours(0,0,0,0);
              
              console.log('midnight is ' + ISODateString(midnight));

              if ((event.start.dateTime <= currTime) && (event.end.dateTime >= currTime)) {

                  // Rank is high number so that it appears at the bottom of the list when sorted.
                  objResults.push({rank: 0, room: response.summary, text: 'Occupied'});
                  appendPre();
              } else {
                if (event.start.dateTime > ISODateString(midnight)) {
                  // Rank is 0 to show its completely available and will appear at the top of the sorted array.
                  objResults.push({rank: 9999, room: response.summary, text: 'Free for the rest of the day'});
                  appendPre();
                } else {
                var diff = Math.ceil((Math.abs(new Date() - Date.parse(event.start.dateTime)))/60000);
                
                // Rank is the minutes free so that rooms can be sorted on that basis. 
                objResults.push({rank: diff, room: response.summary, text: 'Free for the next ' + diff + ' minutes'});
                  appendPre();
                }
              }

            }
          } else {
            console.log('not there yet');
          }
        });
    }
  });

  // POST REST endpoint - note we use 'body-parser' middleware above to parse the request body in this route.
  // This can also be added in application.js
  // See: https://github.com/senchalabs/connect#middleware for a list of Express 4 middleware
  hello.post('/', function(req, res) {
    console.log(new Date(), 'In hello route POST / req.body=', req.body);
    var world = req.body && req.body.hello ? req.body.hello : 'World';

    // see http://expressjs.com/4x/api.html#res.json
    res.json({msg: 'Hello ' + world});
  });

  return hello;
}

module.exports = helloRoute;
