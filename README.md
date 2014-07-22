# angular-mms — angular module that contains core services, directives, filters

This is modified from the angular-seed project and added grunt tasks


## Files

The mms module sources are in src/. app/ contains an application that uses mms module just for testing out things and experimenting with how actual apps would use mms services and directives.


## Building and Running

* install node.js
* install grunt - sudo npm install -g grunt-cli
* cd into angular-mms root dir
* npm install - install all node modules needed to run tasks
* ruby install - sudo gem install ruby
* sass install - sudo gem install sass
* grunt - default task - this will do jshint on all sources inside src/, concat them into dist/mms.js, run jshint on that, minify into dist/mms.min.js, and copy whats in app/ and dist/ into build/
* grunt server - does the default, plus runs a webserver at localhost:9000 and a proxy server that proxies to sheldon for any path starting with /alfresco. This allows us to test with real service endpoint
* grunt server:stub - does the same thing as grunt server except the proxy is to a local stub server, can mock alfresco service api with stubby configurations in mocks/
* grunt clean - deletes dist and build folders

## Testing
TBD - the angular-seed project contains test scripts using karma, jasmine and protractor - need to figure out how to run tests on our src

## Generating Docs
* grunt ngdocs - this would generate html docs based on code comments written in ngdocs style into docs/. The generated files need to be served through a webserver to work.
* grunt docServer - this would generate the docs and run the server at localhost:10000

## Links
* node.js - [http://nodejs.org/](http://nodejs.org/)
* grunt - [http://gruntjs.com/](http://gruntjs.com/)
* sass - [http://sass-lang.com/](http://sass-lang.com/)
* grunt-stubby - [https://github.com/h2non/grunt-stubby](https://github.com/h2non/grunt-stubby)
* ngdocs - [https://github.com/idanush/ngdocs/wiki/API-Docs-Syntax](https://github.com/idanush/ngdocs/wiki/API-Docs-Syntax)
* grunt-ngdocs - [https://github.com/m7r/grunt-ngdocs](https://github.com/m7r/grunt-ngdocs)
* jasmine - [http://jasmine.github.io/](http://jasmine.github.io/)
* karma - [http://karma-runner.github.io/0.12/index.html](http://karma-runner.github.io/0.12/index.html)
