const fs = require('fs');
const cp = require('child_process');

class Plugin{
    constructor( path ){
        let pkg = JSON.parse(fs.readFileSync(path + '/package.json', 'utf-8'));

        this.path = path;
        this.name = pkg.name;
        this.author = pkg.author;
        this.main = pkg.main;
        this.enabled = pkg.enabled;
        this.fork = null;
        this.abortController = null;
    }
    start(){
        if(this.fork || this.abortController)return;

        this.abortController = new AbortController();
        this.fork = cp.fork(this.path + '/' + this.main, { signal: this.abortController.signal });
    }
    stop(){
        if(!this.fork || !this.abortController)return;
        this.abortController.abort();

        this.fork = null;
        this.abortController = null;
    }
}

module.exports = Plugin;