var fs = require('fs');

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

var links = casper.cli.args[0].toString();

links = links.split(",");


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


var i = -1;

function getLinks() {
    // dont get the already approved links
    if ( $('div.translation_list').length > 1 ) {
        var links = document.querySelectorAll('div.translation_list:nth-child(2) .large-details-link');
        return Array.prototype.map.call(links, function (e) {
            return e.getAttribute('href');
        });
    }
}

casper.start('https://sandbox.gengo.com/auth/form/login/', function(){
    casper.echo('URL https://sandbox.gengo.com/auth/form/login/ loaded');
    this.fill('form[action="https://sandbox.gengo.com/auth/login/"]', {
    //this.fill('#login>form', {
        login_email : 'ashley.coker@prowebsoftware.net',
        login_password: 'rVr#fJ9(6x'
    }, true);
});


casper.then(function() {
    this.each(links, function() {
        i++; // change the link being opened (has to be here specifically)
        this.thenOpen(links[i], function() {
            this.echo(links[i]); // display the title of page
        });
    });
});

casper.run(function() {
    // echo results in some pretty fashion
    this.echo(links.length + ' links found:');
    this.echo(links.join('\n'));


    this.exit();
});
