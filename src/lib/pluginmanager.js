const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');
const Plugin = require('./plugin.js');
const repoAPI = require('./repos.js');

class PluginManager{
    constructor(config){
        this.pluginsCache = [];
        this.config = config;
        this.plugins = [];

        if(!fs.existsSync(this.config.dataPath + '/plugins'))
            fs.mkdirSync(this.config.dataPath + '/plugins', { recursive: true });

        repoAPI.fetchRepos(this.config).then(data => {
            for(let i = 0; i < data.length; i++){
                let repo = data[i];

                for (let j = 0; j < repo.plugins.length; j++) {
                    let plugin = repo.plugins[j];
                    this.pluginsCache.push(plugin);
                }
            }

            this.reloadInternal();
        });
    }
    reloadInternal(){
        this.plugins.forEach(p => p.stop());

        console.log('Reloading plugins...');
        this.plugins = [];

        let pluginFolders = fs.readdirSync(this.config.dataPath + '/plugins');

        pluginFolders.forEach(p =>
            this.plugins.push(new Plugin(this.config.dataPath + '/plugins/' + p, this)));

        this.plugins.forEach(p => {
            if(p.enabled)
                p.start();
        });

        console.log('Finished reloading plugins.');
    }
    fetchPluginCache(){
        repoAPI.fetchRepos(this.config).then(data => {
            for(let i = 0; i < data.length; i++){
                let repo = data[i];

                for (let j = 0; j < repo.plugins.length; j++) {
                    let plugin = repo.plugins[j];
                    this.pluginsCache.push(plugin);
                }
            }

            this.reloadInternal();
        });
    }
    hasPlugin(plugin){
        let p = this.plugins.find(p => p.name === plugin.name && p.author === plugin.author);
        if(!p)return false;

        return p.enabled;
    }
    downloadPlugin(plugin){
        let downloadPath = this.config.dataPath + '/plugins/'+plugin.name;

        if(!fs.existsSync(downloadPath))
            fs.mkdirSync(downloadPath, { recursive: true });

        if(!plugin.files || plugin.files.length == 0)
            plugin.files = [ 'package.json', 'index.js' ];

        let onFinish = () => {
            if(!fs.existsSync(this.config.dataPath + '/plugins/'+plugin.name+'/package.json')){
                let pkg = {
                    enabled: true,
                    name: plugin.name,
                    author: plugin.author,
                    main: "index.js"
                }
    
                fs.writeFileSync(this.config.dataPath + '/plugins/'+plugin.name+'/package.json', JSON.stringify(pkg));
            } else{
                let pkg = JSON.parse(fs.readFileSync(this.config.dataPath + '/plugins/'+plugin.name+'/package.json', 'utf-8'));
                pkg.enabled = true;
    
                console.log(JSON.stringify(pkg));
                fs.writeFileSync(this.config.dataPath + '/plugins/'+plugin.name+'/package.json', JSON.stringify(pkg));
            }
    
            this.reloadInternal();
        }

        plugin.files.forEach((f, i) => {
            console.log('Downloading '+f);
            fetch(plugin.url + f).then(data => data.arrayBuffer()).then(data => {
                let p = path.join(downloadPath, f);

                let folderPath = p.split('\\');
                folderPath.pop();
                folderPath = folderPath.join('\\');

                if(!fs.existsSync(folderPath))
                    fs.mkdirSync(folderPath, { recursive: true });

                fs.writeFileSync(p, Buffer.from(data));

                console.log('Finished downloading: '+f);
                if(i === plugin.files.length - 1)
                    onFinish();
            });
        })
    }
    uninstallPlugin(name){
        let downloadPath = this.config.dataPath + '/plugins/'+name;
        fs.rmSync(downloadPath, { recursive: true, force: true });

        this.plugins = this.plugins.filter(x => x.name !== name);
    }
    enablePlugin(plugin){
        let p = this.plugins.find(p => p.name === plugin.name && p.author === plugin.author);
        if(!p)throw new Error('Plugin ' + plugin.name + ' not found');

        let pkg = JSON.parse(fs.readFileSync(this.config.dataPath + '/plugins/'+plugin.name+'/package.json', 'utf-8'));

        p.enabled = true;
        pkg.enabled = true;

        fs.writeFileSync(this.config.dataPath + '/plugins/'+plugin.name+'/package.json', JSON.stringify(pkg));
        this.reloadInternal();
    }
    disablePlugin(plugin){
        let p = this.plugins.find(p => p.name === plugin.name && p.author === plugin.author);
        if(!p)throw new Error('Plugin ' + plugin.name + ' not found');

        let pkg = JSON.parse(fs.readFileSync(this.config.dataPath + '/plugins/'+plugin.name+'/package.json', 'utf-8'));
        
        p.enabled = false;
        pkg.enabled = false;

        fs.writeFileSync(this.config.dataPath + '/plugins/'+plugin.name+'/package.json', JSON.stringify(pkg));
        this.reloadInternal();
    }
    getLoadedPlugins(){
        let plugins = [];

        this.plugins.forEach(p => {
            if(p.enabled)
                plugins.push({ name: p.name, author: p.author, enabled: true });
            else
                plugins.push({ name: p.name, author: p.author, enabled: false });
            
        })

        return plugins;
    }
    broadcastToPlugins(message){
        this.plugins.forEach(p => {
            if(p.fork)
                p.fork.send(message);
        });
    }
}

module.exports = PluginManager;