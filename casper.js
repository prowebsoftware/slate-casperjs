var casper = require("casper").create();

//var page = require('webpage').create();
//page.settings.clearMemoryCaches = true;
//casper.options.page = page;

casper.echo("Casper CLI passed args:");
require("utils").dump(casper.cli.args);

var slateValetUrl = casper.cli.args[0].toString();
var slateServerUrl = casper.cli.args[1].toString();
var authCode = casper.cli.args[2].toString();

casper.options.viewportSize = {width: 1024, height: 768};
casper.options.waitTimeout = 20 * 1000; 
//casper.options.verbose = true;
casper.options.logLevel = "debug";
casper.options.pageSettings.clearMemoryCaches = true;

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

casper.on( 'page.error', function (msg, trace) {
    this.echo( '  Error: ' + msg, 'ERROR' );
});

phantom.clearCookies();

function clearStorage(){
    casper.evaluate(function() {
        localStorage.clear();
        sessionStorage.clear();
    });
}

function hashChange(){
    casper.evaluate(function(){
        function hashHandler( ){
            this.oldHash = window.location.hash;
            this.Check;

            var that = this;
            var detect = function(){
                if(that.oldHash!=window.location.hash){
                    console.log("HASH CHANGED - new hash" + window.location.hash);
                    that.oldHash = window.location.hash;
                }
            };
            this.Check = setInterval(function(){ detect() }, 10);
        };

        new hashHandler();

    });
}

var captureCounter = 1;
function captureFunc( name ){
    casper.capture(captureCounter+'_'+name);
    captureCounter+=1;
}

casper.start(slateValetUrl, function(){
    clearStorage();
    hashChange();
});

casper.then(function(){
    casper.waitForSelector("input#ext-element-17",
        function success() {
            captureFunc(authCode+'_capture_SERVER_URL.png');
            this.sendKeys("input#ext-element-17", slateServerUrl);
        },
        function fail() {
            captureFunc(authCode + '_capture_SERVER_URL_fail.png');
        });
});

casper.then(function(){
    casper.waitForSelector("div#SERVER_BASE_URL_SUBMIT_BUTTON",
        function success() {
            captureFunc(authCode+'_capture_SERVER_BASE_URL_SUBMIT_BUTTON.png');
            this.click("div#SERVER_BASE_URL_SUBMIT_BUTTON");
        },
        function fail() {
            captureFunc(authCode+'_capture_SERVER_BASE_URL_SUBMIT_BUTTON_fail.png');
        });
});

casper.then(function(){
    casper.waitForSelector("div#KEY_PAD_1",
        function success() {
            this.click("div#KEY_PAD_"+authCode.substr(0, 1));
            this.click("div#KEY_PAD_"+authCode.substr(1, 1));
            this.click("div#KEY_PAD_"+authCode.substr(2, 1));
            this.click("div#KEY_PAD_"+authCode.substr(3, 1));
            this.click("div#KEY_PAD_"+authCode.substr(4, 1));
        },
        function fail() {
        });
});

casper.then(function(){
    casper.waitForSelector("#MSG_BOX_OK_BUTTON",
        function success() {
            this.click("#MSG_BOX_OK_BUTTON");
            captureFunc(authCode+'_capture_MSG_BOX_OK_BUTTON.png');
        },
        function fail() {
            captureFunc(authCode+'_capture_MSG_BOX_OK_BUTTON_fail.png');
        });
});

casper.then(function(){
    casper.waitForUrl(/selectlanguage/,
        function success() {
            casper.wait(10 * 1000, function(){
                captureFunc(authCode+'_capture_SELECT_LANGUAGE.png');
            });
        },
        function fail() {
            captureFunc(authCode+'_capture_SELECT_LANGUAGE_fail.png');
        });
});


casper.run(function() {});