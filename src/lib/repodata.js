const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const PluginData = require('./plugindata.js');

class RepoData{
    constructor(){
        this.name = null;
        this.url = null;
        this.author = null;
        this.plugins = [];
    }
    fromMeta(meta, cb){
        this.name = meta.name;
        this.author = meta.author;

        this.getPlugin(meta.plugins, 0, cb);
    }
    getPlugin(plugins, i, cb){
        if(!plugins[i])return cb();

        PluginData.from(plugins[i]).then(plugin => {
            this.plugins.push(plugin);
            
            if(plugins[i + 1])
                this.getPlugin(plugins, i + 1, cb);
            else
                cb();
        });
    }
    toJSON(){
        let plugins = [];
        this.plugins.forEach(plugin => plugins.push(plugin.toJSON()));

        return {
            name: this.name,
            url: this.url,
            author: this.author,
            plugins: plugins
        }
    }
}

RepoData.from = ( url ) => {
    console.log('Fetching repository data from:', url);
    return new Promise((resolve, reject) => {
        let rdata = new RepoData();

        if(!url.endsWith('/'))
            url += '/';

        rdata.url = url;
        fetch(url + 'meta.json').then(data => data.json()).then(data => {
            console.log('Got repo data from:', url);
            rdata.fromMeta(data, () => resolve(data));
        }).catch(e => {
            console.error(e);
            reject(e);
        });
    })
}

module.exports = RepoData;