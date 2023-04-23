const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class PluginData{
    constructor(){
        this.name = null;
        this.description = null;
        this.author = null;
        this.url = null;
    }
    fromMeta(meta){
        this.name = meta.name;
        this.description = meta.description;
        this.author = meta.author;
    }
    toJSON(){
        return {
            name: this.name,
            description: this.description,
            author: this.author
        }
    }
}

PluginData.from = ( url ) => {
    console.log('Fetching plugin data from:', url);
    return new Promise((resolve, reject) => {
        let pdata = new PluginData();

        if(!url.endsWith('/'))
            url += '/';

        pdata.url = url;
        fetch(url + 'meta.json').then(data => data.json()).then(data => {
            console.log('Recived plugin data:', url);
            pdata.fromMeta(data);
            resolve(data);
        }).catch(e => {
            console.error(e);
            reject(e);
        });
    });
}

module.exports = PluginData;