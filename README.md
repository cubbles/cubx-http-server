# cubx-http-server: a command-line http server

`cubx-http-server` is a simple, zero-configuration command-line http server based on the popoular [`http-server`](https://www.npmjs.com/package/http-server) npm package.

# Installing globally:

Installation via `npm`:

     npm install cubx-http-server -g

This will install `cubx-http-server` globally so that it may be run from the command line.

## Usage:

     cubx-http-server [path] [options]

`[path]` defaults to `./public` if the folder exists, and `./` otherwise.

## Usage

### Starting cubx-http-server locally

     node bin/cubx-http-server

*Now you can visit http://localhost:8080 to view your server*

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

`--networkProxyUrl`  Add a proxy used to connect to the fallback proxy ([proto]://[host]:[port] e.g. https://10.0.0.0:8000)

`-S` or `--ssl` Enable https.

`-C` or `--cert` Path to ssl cert file (default: cert.pem).

`-K` or `--key` Path to ssl key file (default: key.pem).

`-r` or `--robots` Provide a /robots.txt (whose content defaults to 'User-agent: *\nDisallow: /')

`-h` or `--help` Print this list and exit.

## configure network proxy by enviroment variables
    
The following environment variables are respected `:

 * `HTTP_PROXY` / `http_proxy`
 * `HTTPS_PROXY` / `https_proxy`
 * `NO_PROXY` / `no_proxy`

When `HTTP_PROXY` / `http_proxy` are set, they will be used to proxy non-SSL requests that do not have an explicit `proxy` configuration option present. 
Similarly, `HTTPS_PROXY` / `https_proxy` will be respected for SSL requests that do not have an explicit `proxy` configuration option. 
    
    export http_proxy=http://myProxy:80
    export https_proxy=https://myHttpsProxy:443

The `cubx-http-server` is also aware of the `NO_PROXY`/`no_proxy` environment variables. These variables provide a granular way to opt out of network proxying, on a per-host basis. 
It should contain a comma separated list of hosts to opt out of proxying. It is also possible to opt of proxying when a particular destination port is used. 
Finally, the variable may be set to `*` to opt out of the implicit proxy configuration of the other environment variables.

Here's some examples of valid `no_proxy` values:

 * `google.com` - don't proxy HTTP/HTTPS requests to Google.
 * `google.com:443` - don't proxy HTTPS requests to Google, but *do* proxy HTTP requests to Google.
 * `google.com:443, yahoo.com:80` - don't proxy HTTPS requests to Google, and don't proxy HTTP requests to Yahoo!
 * `*` - ignore `https_proxy`/`http_proxy` environment variables altogether.
