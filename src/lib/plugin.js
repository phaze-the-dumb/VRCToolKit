const fs = require('fs');

class Plugin{
    constructor( path ){
        let pkg = JSON.parse(fs.readFileSync(path + '/package.json', 'utf-8'));

        this.name = pkg.name;
        this.author = pkg.author;
        this.main = pkg.main;
        this.enabled = pkg.enabled;
    }
}

module.exports = Plugin;