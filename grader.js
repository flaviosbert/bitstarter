#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var buildfn = function(buffer, checksfile) {
    var bufferCheckCall = function(result, response) {
	if (result instanceof Error) {
/*	    console.error('Error: ' + util.format(response.message));*/
	    console.error(response);
	    console.error(result);
	} else {	  
	    console.log("Returning to callback");
	    checkHtmlBuffer(result, checksfile);
	}
    };
    return bufferCheckCall;
};

var cheerioBuffer = function(buffer) {
    return cheerio.load(buffer);
};

var getHtmlFileFromUrl = function(url, checksfile) {
    var bufferCheckCall = buildfn(url, checksfile);
    console.log("Calling asynchronous function");
    rest.get(url).on('complete', bufferCheckCall);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, url, checksfile) {    
    if (url!=undefined) {
        console.log("URL informed. Start online checking");
        getHtmlFileFromUrl(url, checksfile);
    }
    else {
	if (htmlfile!=undefined) {
            console.log("File path informed. Start local checking");
            checkHtmlBuffer(fs.readFileSync(htmlfile), checksfile);
	}
	else {
	    console.error("Error: Expected parameter file or url.");
	}
    }
};

var checkHtmlBuffer = function(buffer, checksfile) {
    console.log("Starting buffer check");
    $ = cheerioBuffer(buffer);
    var checks = loadChecks(checksfile).sort();         
    var out = {};                                     
    for(var ii in checks) {                        
        var present = $(checks[ii]).length > 0;            
        out[checks[ii]] = present;                      
    }                                                 
    var outJson = JSON.stringify(out, null, 4);
    console.log(outJson);
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT) 
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists),HTMLFILE_DEFAULT)
        .option('-u, --url <file_url>', 'URL to index.html')
	.parse(process.argv);
    checkHtmlFile(program.file, program.url, program.checks);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
