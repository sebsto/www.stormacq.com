'use strict';

exports.handler = (event, context, callback) => {
    console.log(`Event = \n${JSON.stringify(event)}\n` );
    
    const response = event.Records[0].cf.response;
    const request = event.Records[0].cf.request;
    
    let uri = request.uri.toLowerCase();

    // for request to /about, go to the new about page 
    if ( uri.endsWith('/about') || uri.endsWith('/about/') ) {
        console.log('/about');
        response.status = 301; //moved permanently 
        response.statusDescription = 'Moved Permanently'; //moved permanently 
        response.headers['Location'] = [ { 'key' :  'Location', 
                                           'value' : 'https://stormacq.com/about/index.html'
        }]
    } else if ( uri.endsWith('/podcast') || uri.endsWith('/podcasts') || uri.endsWith('/podcast/') || uri.endsWith('/podcasts/') ) {
        console.log('podcasts\n');
        response.status = 301; //moved permanently 
        response.statusDescription = 'Moved Permanently'; //moved permanently 
        response.headers['Location'] = [ { 'key' :  'Location', 
                                           'value' : `https://stormacq.com/podcasts/index.html`
        }]
    } else {
    
        // for requests being denied by S3 AND
        // not going to /old/ website AND 
        // not finishing with 'index.html'  AND
        // not being wp-admin AND
        // not being wp-login.php
        console.log(`response status = ${response.status}\n`);
        console.log(`uri             = ${uri}\n`);
        if ( response.status == 403  && 
             ! uri.startsWith('/old/')  && 
             ! uri.endsWith('index.html') &&
             ! uri.startsWith('/posts/') && 
             ! uri.includes('wp-admin') && 
             ! uri.includes('wp-login.php')) {
        
            console.log(`redirect trigered for ${request.uri}`);
            
            // when there is no file name, add index.html
            let newURI = 'https://www.stormacq.com/old' + uri;
            // const regex = /[^/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/gm;
            const regex = /(\.\w{2,4})$/;
            let m = newURI.match(regex);
            if (m == null) {
                console.log('No regexp match, adding index.html to ' + newURI);
                if ( uri.endsWith('/') ) {
                    newURI += 'index.html';
                } else {
                    newURI += '/index.html'
                }
            }
            
            response.status = 301; //moved permanently 
            response.statusDescription = 'Moved Permanently'; //moved permanently 
            response.headers['Location'] = [ { 'key' :  'Location', 
                                               'value' : newURI 
            }]
        } 
    }
    
    console.log(`Response : \n ${JSON.stringify(response)} \n`);
    
    callback(null, response);
};
