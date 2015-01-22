var casper = require("casper").create({
    verbose: true,
    logLevel: 'debug',
    waitTimeout: 20 * 1000,
    viewportSize: {
        width: 1024,
        height: 768
    },
    //userAgent: '',
    pageSettings: {
        clearMemoryCaches: true
    },

    clientScripts: ['jquery-2.1.3.js']
});

casper.echo("Casper CLI passed args:");
require("utils").dump(casper.cli.args);

var slateValetUrl = casper.cli.args[0].toString();
var slateServerUrl = casper.cli.args[1].toString();
var authCode = casper.cli.args[2].toString();

var currentElement = '';

casper.options.onResourceRequested = function(C, requestData, request) {
    if ((/http:\/\/.+?.css/gi).test(requestData['url']) || requestData['Content-Type'] == 'text/css') {
        //console.log(‘Skipping CSS file: ’ + requestData[‘url’]);
        //request.abort();
    }

    if ( requestData['url'].search('http://')!=-1 || requestData['url'].search('https://')!=-1 ) {
        casper.echo('REQUEST:  '+requestData['url']);
    }
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

//phantom.clearCookies();

function clearStorage(){

    //casper.echo('CURRENT COOKIE:  '+document.cookie);

    casper.evaluate(function() {
        var promise = services.WebSqlKeyValue.clear();
        promise.then(function(){
            localStorage.clear();
            console.log('********** WebSQL and localstorage cleared **********');
            //sessionStorage.clear();
        }, function( e ){
            console.log('********** WebSQL and localstorage clear FAILED!!!! **********');
            console.log(e);
        });
    });

    casper.page.setCookies(""); //clears the cookies
}

/*function hashChange(){
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
}*/

var captureCounter = 1;
function captureFunc( name ){
    var captureName = captureCounter+'_'+name+'_'+casper.getCurrentUrl();
    captureName = captureName.replace(/[^a-z0-9]/gi, '_').toLowerCase()+'.png';
    casper.echo(captureName);
    casper.capture(captureName);
    captureCounter+=1;
}

casper.start(slateValetUrl, function(){
    clearStorage();
    this.reload(function() {
        this.echo("****** loaded again after clearing local storage *******");
    });
});

casper.waitForSelector("input#ext-element-17",
    function success() {
        captureFunc(authCode+'_capture_SERVER_URL');
        this.sendKeys("input#ext-element-17", slateServerUrl);
    },
    function fail() {
        captureFunc(authCode + '_capture_SERVER_URL_fail');
    });


casper.waitForSelector("div#SERVER_BASE_URL_SUBMIT_BUTTON",
    function success() {
        captureFunc(authCode+'_capture_SERVER_BASE_URL_SUBMIT_BUTTON');
        this.click("div#SERVER_BASE_URL_SUBMIT_BUTTON");
    },
    function fail() {
        captureFunc(authCode+'_capture_SERVER_BASE_URL_SUBMIT_BUTTON_fail');
    });

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

casper.waitForSelector("#MSG_BOX_OK_BUTTON",
    function success() {
        //this.click("#MSG_BOX_OK_BUTTON");
        captureFunc(authCode+'_capture_MSG_BOX_OK_BUTTON');
        //this.open('/');
        this.evaluate(function(slateValetUrl){
            window.location = slateValetUrl;
        },{
            slateValetUrl: slateValetUrl
        });
    },
    function fail() {
        captureFunc(authCode+'_capture_MSG_BOX_OK_BUTTON_fail');
    });

casper.waitForSelector('.welcomeTo',
    function success() {
        casper.wait(10 * 1000, function(){
            captureFunc(authCode+'_capture_SELECT_LANGUAGE');
            //this.click('.frontLanguageFlag');

            ajaxLoop();
        });
    },
    function fail() {
        captureFunc(authCode+'_capture_SELECT_LANGUAGE_fail');

});

//__utils__.sendAJAX

function ajaxLoop(){

    var element = casper.evaluate(function(){

        var response;

        $.ajax({
            url: 'http://prowebsoftware.redirectme.net:8082/element.json',
            success: function( data ) {
                console.log('PAGE ELEMENT: '+data.element);
                if ( data && data.element ) {
                    response = data.element;
                }else{
                    response = false;
                }
            },
            async: false
        });

        return response;

    });

    //setTimeout(ajaxLoop,5000);

    casper.wait(5 * 1000, function(){
        if ( currentElement !== element ) {
            try {
                casper.click(element);
            }catch(e){

            }
            casper.wait(3 * 1000, function(){
                captureFunc(authCode + '_' + (element ? element : 'screenshot'));
            });
        }
        currentElement = element;

        ajaxLoop();
    });
}

/*casper.waitForSelector('.icoMenu',
    function success() {
        casper.wait(5 * 1000, function(){
            captureFunc(authCode+'_capture_LANDING_SCREEN');
        });
    },
    function fail() {
        captureFunc(authCode+'_capture_LANDING_SCREEN_fail');

    });*/


casper.run(function() {});