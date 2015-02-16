var fs = require('fs');
//var fname = new Date().getTime() + '.txt';
var fname = 'links.txt';
var save = fs.pathJoin(fs.workingDirectory, 'gengoLinks', fname);

var casper = require("casper").create({
    //verbose: true,
    //logLevel: 'debug',
    waitTimeout: 60 * 1000,
    viewportSize: {
        width: 1024,
        height: 768
    },
    //userAgent: '',
    pageSettings: {
        clearMemoryCaches: true,
        loadImages:  false,        // do not load images
        loadPlugins: false
    },

    clientScripts: ['jquery-2.1.3.js']
});

casper.echo("Casper CLI passed args:");
require("utils").dump(casper.cli.args);



casper.options.onResourceRequested = function(C, requestData, networkRequest) {
    if ((/http:\/\/.+?.css/gi).test(requestData['url']) || requestData['Content-Type'] == 'text/css') {
        //console.log(‘Skipping CSS file: ’ + requestData[‘url’]);
        //request.abort();
    }

    //console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData, undefined, 2))

    if ( requestData['url'].search('http://')!=-1 || requestData['url'].search('https://')!=-1 ) {
        //casper.echo('REQUEST:  '+requestData['url']);
    }
}



casper.options.onResourceReceived = function(C, response) {

    //console.log('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response, undefined, 2));
}



//var x = require('casper').selectXPath;
casper.on('page.error', function(msg, trace) {
    this.echo('Error: ' + msg, 'ERROR');
    for(var i=0; i<trace.length; i++) {
        var step = trace[i];
        this.echo('   ' + step.file + ' (line ' + step.line + ')', 'ERROR');
    }
});


casper.on('remote.message', function(msg) {
    this.echo('    ' + msg);
});

var links = [];
var i = -1;

function getLinks() {
    // Check if there is a 'Pending' section in the list else we will get the already Approved links
    var gengoSections = document.querySelectorAll('div.translation_list');

    // try and find the Pending list.
    var lists = document.querySelectorAll('h2.no_border'),
        pendingList = false;

    if ( lists && lists.length ){
        for ( i=0; i < lists.length; i++ ){
            if ( lists[i].innerHTML.indexOf('Pending')!==-1 ){
                pendingList = lists[i];
            }
        }
    }

    if ( pendingList ){
        console.log('Found pending translations...');
        var links = $(pendingList).parent().find('.large-details-link');
        return Array.prototype.map.call(links, function (e) {
            return e.getAttribute('href');
        });
    }else{
        console.log('No pending list found, returning empty');
        return [];
    }

    /**/
}

casper.start('https://sandbox.gengo.com/auth/form/login/', function(){
    this.fill('form[action="https://sandbox.gengo.com/auth/login/"]', {
        login_email : 'ashley.coker@prowebsoftware.net',
        login_password: 'rVr#fJ9(6x'
    }, true);
});


casper.then(function() {
    // aggregate results for the 'casperjs' search
    links = this.evaluate(getLinks);

    links = Array.prototype.map.call(links, function( href ) {
        return 'http://sandbox.gengo.com/s_set_reviewable/'+href.substr(11);
    });

});


/*casper.then(function() {
    this.each(links, function() {
        i++; // change the link being opened (has to be here specifically)
        this.thenOpen(links[i], function() {
            this.echo(links[i]); // display the title of page
        });
    });
});*/

casper.run(function() {
    // echo results in some pretty fashion
    this.echo(links.length + ' links found:');
    this.echo(links.join('\n'));

    fs.write(save, links.join('\n'), 'w');

    this.exit();
});