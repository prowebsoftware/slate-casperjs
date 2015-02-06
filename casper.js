var casper = require("casper").create({
    //verbose: true,
    //logLevel: 'debug',
    waitTimeout: 75 * 1000,
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
var currentJavascript = '';

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
    this.echo('    > ' + msg);
});


var captureCounter = 1;
function captureFunc( name ){
    var captureName = captureCounter+'_'+name+'_'+casper.getCurrentUrl();
    captureName = captureName.replace(/[^a-z0-9]/gi, '_').toLowerCase()+'.png';
    casper.echo(captureName);
    casper.capture(captureName);
    captureCounter+=1;
}

casper.start(slateValetUrl);

casper.wait(3000);

casper.thenOpen(slateValetUrl.substring(0, slateValetUrl.indexOf('/reset.html')));

casper.waitForSelector("input#ext-element-17",
    function success() {
        captureFunc(authCode+'_capture_SERVER_URL');
        this.sendKeys("input#ext-element-17", slateServerUrl);
    },
    function fail() {
        captureFunc(authCode + '_capture_SERVER_URL_fail');
        casper.echo('_capture_SERVER_URL_fail');
        casper.exit();
    });


casper.waitForSelector("div#SERVER_BASE_URL_SUBMIT_BUTTON",
    function success() {
        captureFunc(authCode+'_capture_SERVER_BASE_URL_SUBMIT_BUTTON');
        this.click("div#SERVER_BASE_URL_SUBMIT_BUTTON");
    },
    function fail() {
        captureFunc(authCode+'_capture_SERVER_BASE_URL_SUBMIT_BUTTON_fail');
        casper.echo('_capture_SERVER_URL_fail');
        casper.exit();
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
        captureFunc(authCode+'_capture_KEYPAD_fail');
        casper.echo('_capture_KEYPAD_fail');
        casper.exit();
    });

casper.waitForSelector("#MSG_BOX_OK_BUTTON",
    function success() {
        captureFunc(authCode+'_capture_MSG_BOX_OK_BUTTON');
        this.click("#MSG_BOX_OK_BUTTON");
    },
    function fail() {
        captureFunc(authCode+'_capture_MSG_BOX_OK_BUTTON_fail');
        casper.echo('_capture_MSG_BOX_OK_BUTTON_fail');
        casper.exit();
    });

casper.waitForSelector('.welcomeTo',
    function success() {
        casper.wait(10 * 1000, function(){
            captureFunc(authCode+'_capture_SELECT_LANGUAGE');
        });
    },
    function fail() {
        captureFunc(authCode+'_capture_SELECT_LANGUAGE_fail');
        casper.echo('_capture_SELECT_LANGUAGE_fail');
        casper.exit();
    });

casper.then(function(){
    casper.wait(5000, function(){
        ajaxLoop();
    });

});


function ajaxLoop(){

    var response = casper.evaluate(function(){

        var response;

        $.ajax({
            url: 'http://prowebsoftware.redirectme.net:8082/element.json',
            success: function( data ) {
                //console.log('PAGE ELEMENT: '+data.element);
                response = data;
            },
            async: false
        });

        return response;

    });

    casper.wait(5 * 1000, function(){
        if ( response && response.authCode && response.authCode!='' && (response.authCode==authCode || response.authCode=='ALL' ) ) {
            if (response && response.element) {
                if (currentElement !== response.element) {
                    try {
                        casper.click(response.element);
                        console.log('CLICKED ' + response.element);
                    } catch (e) {
                        console.log('CANT CLICK ' + response.element);
                    }
                    casper.wait(3 * 1000, function () {
                        captureFunc(authCode + '_' + (response.element ? response.element : 'screenshot'));
                    });
                }
                currentElement = response.element;
            }

            if (response && response.javascript) {
                if (currentJavascript !== response.javascript && response.javascript!=='') {
                    casper.evaluate(function (javascript) {
                        try {
                            eval(javascript);
                        }catch(e){
                            console.log('Error evaluating received javascript');
                        }
                    }, {
                        javascript: response.javascript
                    });

                    casper.wait(5000, function () {
                        captureFunc(authCode + '_javascript');
                    });
                }
                currentJavascript = response.javascript;
            }
        }

        ajaxLoop();
    });
}

casper.run(function() {});