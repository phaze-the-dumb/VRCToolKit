const { app, Tray, Menu, nativeImage, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { Server } = require('node-osc');
const PluginManager = require('./lib/pluginmanager.js');
const repoAPI = require('./lib/repos.js');

if(require('electron-squirrel-startup'))app.quit();

const appdetector = require('./lib/appdetector');
const logs = require('./lib/vrclogparser');

let config = {
    pluginRepos: [ 'https://cdn.phaze.gay/phaze-the-dumb/plugin-repo/' ],
    dataPath: path.join(os.homedir(), './AppData/LocalLow/phaze/VRChatToolKit')
};

if(!fs.existsSync('config.json'))
    fs.writeFileSync('config.json', JSON.stringify(config), 'utf8')

let tmpConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let changes = false;
Object.keys(config).forEach(key => {
    if(!tmpConfig[key]){
        tmpConfig[key] = config[key];
        changes = true;
    }
})

if(changes)
    fs.writeFileSync('config.json', JSON.stringify(config), 'utf8');

config = tmpConfig;

if(!fs.existsSync(config.dataPath))
    fs.mkdirSync(config.dataPath, { recursive: true });

let s = new Server(9001, '127.0.0.1');
let oscstatus = { text: 'Connecting.' };
let lastWorld = null;
let username = null;
let gameRunning = false;
let lastLog = 'Starting OSC Server...<br />';
let oscLogsOpen = false;
let osclogs;
let repoCache = null;
let session = null;
let pluginManager = new PluginManager(config);

appdetector.checkForProcess('VRChat.exe').then(running => gameRunning = running);
s.on('listening', () => {
    oscstatus.text = 'Connected.';
    lastLog += 'OSC Server Listening...<br />';

    console.log('OSC Server Started...');
});

s.on('message', msg => {
    lastLog += msg[0] + ' (';
    msg.shift();
    lastLog += msg.join(', ') + ')<br />';
})

app.on('ready', () => {
    let win = new BrowserWindow({
        width: 1200,
        height: 700,
        frame: false,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        },
        hasShadow: true,
        title: 'VRChat ToolKit',
        icon: __dirname + '/icon.png'
    })

    ipcMain.on('minimise', () => win.minimize());
    ipcMain.on('restore-up', () => win.maximize());
    ipcMain.on('restore-down', () => win.restore());
    ipcMain.on('close', () => win.hide());

    ipcMain.on('open-osclogs', () => {
        if(oscLogsOpen)return osclogs.focus();
        oscLogsOpen = true;

        osclogs = new BrowserWindow({
            title: 'VRChat ToolKit',
            icon: __dirname + '/icon.png',
            width: 700,
            height: 550
        })

        osclogs.loadFile(path.join(__dirname, '/views/logs.html'));

        osclogs.on('close', () => 
            oscLogsOpen = false);
    });

    win.loadFile(path.join(__dirname, '/views/index.html'));

    let tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '/icon.png')));
    let ctxMenu = Menu.buildFromTemplate([
        { label: 'Open', type: 'normal', click: () => {
            win.show();
        } },
        { label: 'Quit', type: 'normal', click: () => {
            process.exit(0);
        } }
    ])

    tray.on('click', () =>
        win.show());

    tray.setContextMenu(ctxMenu);
})

http.createServer((req, res) => {
    if(req.url === '/session.json'){
        session = crypto.randomUUID();
        return res.end(JSON.stringify({ session }));
    }

    if(req.url === '/log.txt'){
        res.end(lastLog);
        lastLog = '';

        return;
    }

    if(req.headers.auth !== session)return res.end('no');
    if(req.url === '/gamerunning.json' && gameRunning)
        return res.end(JSON.stringify({
            running: true,
            world: lastWorld,
            username,
            oscstatus
        }));

    if(req.url === '/gamerunning.json' && !gameRunning)
        return res.end('{"running":false}');

    if(req.url === '/config.json')
        return res.end(JSON.stringify(config));

    if(req.url.startsWith('/removeRepo?')){
        console.log('Remove Repo: '+req.url.replace('/removeRepo?', ''))

        config.pluginRepos = config.pluginRepos.filter(x => x !== req.url.replace('/removeRepo?', ''));
        fs.writeFileSync('config.json', JSON.stringify(config), 'utf8');

        pluginManager.fetchPluginCache();
        repoAPI.fetchRepos(config).then(data => repoCache = data);

        return res.end('ok');
    }

    if(req.url.startsWith('/addRepo?')){
        console.log('Add Repo: '+req.url.replace('/addRepo?', ''))

        config.pluginRepos.push(req.url.replace('/addRepo?', ''))
        fs.writeFileSync('config.json', JSON.stringify(config), 'utf8');

        pluginManager.fetchPluginCache();
        repoAPI.fetchRepos(config).then(data => repoCache = data);

        return res.end('ok');
    }

    if(req.url === '/repodata.json')
        return res.end(JSON.stringify(pluginManager.getLoadedPlugins()));

    if(req.url === '/repos.json'){
        if(repoCache)
            return res.end(JSON.stringify(repoCache));
        else{
            repoAPI.fetchRepos(config).then(data => {
                repoCache = data;
                res.end(JSON.stringify(repoCache));
            });

            return;
        }
    }

    if(req.url === '/reloadRepos'){
        repoAPI.fetchRepos(config).then(data => {
            repoCache = data;
            res.end(JSON.stringify(repoCache));
        });

        return;
    }

    if(req.url.startsWith('/install/')){
        let parts = req.url.split('/');
        parts.shift();
        parts.shift();

        let repo = repoCache.find(r => r.name === parts[0])
        if(!repo)return res.end('Cannot find repo');

        let plugin = repo.plugins.find(p => p.name === parts[1]);
        if(!plugin)return res.end('Cannot find plugin');

        if(!pluginManager.hasPlugin(plugin))
            pluginManager.downloadPlugin(plugin);
        else
            pluginManager.enablePlugin(plugin);

        return res.end("{\"ok\":true}");
    }

    if(req.url.startsWith('/uninstall/')){
        let parts = req.url.split('/');
        parts.shift();
        parts.shift();

        let repo = repoCache.find(r => r.name === parts[0])
        if(!repo)return res.end('Cannot find repo');

        let plugin = repo.plugins.find(p => p.name === parts[1]);
        if(!plugin)return res.end('Cannot find plugin');

        pluginManager.disablePlugin(plugin);
        return res.end("{\"ok\":true}");
    }

    if(req.url.startsWith('/remove/')){
        let parts = req.url.split('/');
        parts.shift();
        parts.shift();

        let repo = repoCache.find(r => r.name === parts[0])
        if(!repo)return res.end('Cannot find repo');

        let plugin = repo.plugins.find(p => p.name === parts[1]);
        if(!plugin)return res.end('Cannot find plugin');

        if(pluginManager.hasPlugin(plugin))
            pluginManager.uninstallPlugin(plugin.name);
            
        return res.end("{\"ok\":true}");
    }

    res.end('404 Not Found');
}).listen(8085).on('error', ( err ) => {
    app.quit();
    throw new Error('App already running... Check your tray.');
});

setInterval(() => {
    appdetector.checkForProcess('VRChat.exe').then(running => gameRunning = running);

    if(gameRunning){
        let ls = logs.readLogs();

        lastWorld = logs.getLastWorld(ls);
        username = logs.getUsername(ls);
    } else
        lastWorld = null;
}, 10000)