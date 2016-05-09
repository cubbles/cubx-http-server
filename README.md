# cubx-http-server: a command-line http server

`cubx-http-server` is a simple, zero-configuration command-line http server based in the popoular [`http-server`](https://www.npmjs.com/package/http-server) npm package.

# Installing globally:

Installation via `npm`:

     npm install cubx-http-server -g

This will install `cubx-http-server` globally so that it may be run from the command line.

## Usage:

     cubx-http-server [path] [options]

`[path]` defaults to `./public` if the folder exists, and `./` otherwise.

# Installing as a node app

     mkdir myapp
     cd myapp/
     jitsu install cubx-http-server

*If you do not have `jitsu` installed you can install it via `npm install jitsu -g`*

## Usage

### Starting http-server locally

     node bin/cubx-http-server

*Now you can visit http://localhost:8080 to view your server*

### Deploy http-server to nodejitsu

     jitsu deploy

*You will now be prompted for a `subdomain` to deploy your application on*

## Available Options:

`-p` Port to use (defaults to 8080)

`-a` Address to use (defaults to 0.0.0.0)

`-d` Show directory listings (defaults to 'True')

`-i` Display autoIndex (defaults to 'True')

`-e` or `--ext` Default file extension if none supplied (defaults to 'html')

`-s` or `--silent` Suppress log messages from output

`--cors` Enable CORS via the `Access-Control-Allow-Origin` header

`-o` Open browser window after starting the server

`-c` Set cache time (in seconds) for cache-control max-age header, e.g. -c10 for 10 seconds (defaults to '3600'). To disable caching, use -c-1.

`-U` or `--utc` Use UTC time format in log messages.

`-P` or `--proxy` Proxies all requests which can't be resolved locally to the given url. e.g.: -P http://someurl.com

`-npu` or `--networkProxyUrl`  Add a proxy used to connect to the fallback proxy ([proto]://[host]:[port] e.g. https://10.0.0.0:8000)

`-S` or `--ssl` Enable https.

`-C` or `--cert` Path to ssl cert file (default: cert.pem).

`-K` or `--key` Path to ssl key file (default: key.pem).

`-r` or `--robots` Provide a /robots.txt (whose content defaults to 'User-agent: *\nDisallow: /')

`-h` or `--help` Print this list and exit.
