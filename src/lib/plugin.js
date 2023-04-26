const fs = require('fs');
const cp = require('child_process');

class Plugin{
    constructor( path, manager ){
        let pkg = JSON.parse(fs.readFileSync(path + '/package.json', 'utf-8'));

        this.path = path;
        this.name = pkg.name;
        this.author = pkg.author;
        this.main = pkg.main;
        this.enabled = pkg.enabled;
        this.manager = manager;
        this.fork = null;
        this.abortController = null;
        this.exists = true;

        let pluginInfo = this.manager.pluginsCache.find(x => x.name === this.name && x.author === this.author);
        if(!pluginInfo){
            this.manager.uninstallPlugin(this.name);
            this.exists = false;

            return console.log("Plugin repo for: " + this.name + " not found, uninstalling plugin...");
        }

        this.url = pluginInfo.url;
    }
    onMsg(msg){
        
    }
    start(){
        if(this.fork || this.abortController || !this.exists)return;

        this.abortController = new AbortController();
        this.fork = cp.fork(this.path + '/' + this.main, { signal: this.abortController.signal });

        this.fork.on('message', ( msg ) => this.onMsg(msg));
    }
    stop(){
        if(!this.fork || !this.abortController|| !this.exists)return;
        this.abortController.abort();

        this.fork = null;
        this.abortController = null;
    }
}

module.exports = Plugin;