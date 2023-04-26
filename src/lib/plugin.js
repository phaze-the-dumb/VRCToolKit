const fs = require('fs');
const cp = require('child_process');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
        this.version = pkg.version || 'None';
        this.abortController = null;
        this.exists = true;
        this.needsUpdate = false;

        let pluginInfo = this.manager.pluginsCache.find(x => x.name === this.name && x.author === this.author);
        if(!pluginInfo){
            this.manager.uninstallPlugin(this.name);
            this.exists = false;

            return console.log("Plugin repo for: " + this.name + " not found, uninstalling plugin...");
        }

        this.pluginInfo = pluginInfo;
        this.url = pluginInfo.url;

        if(!pkg.version){
            console.log('PLUGIN "'+this.name+'" DOESN\'T HAVE A VERSION, ADD ONE OR AUTOMATIC VERSION UPDATING WILL NOT WORK.');
            console.log('I spent time making automatic version updating, you will use it, or i will steal you kneecaps');
        } else
            this.checkForUpdates();
    }
    checkForUpdates(){
        console.log('Checking for updates...', this.url + 'package.json');

        fetch(this.url + 'package.json').then(data => data.json()).then(data => {
            if(!data.version)
                data.version = 'None';

            if(data.version !== this.version){
                this.needsUpdate = true;
                console.log(this.name + ' Needs to be updated, updating automatically');

                this.manager.uninstallPlugin(this.name);
                this.manager.downloadPlugin(this.pluginInfo);

                this.stop();
            }
        })
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