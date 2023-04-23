const fs = require('fs');
const os = require('os');
const path = require('path');
const { FormatDate } = require('./date');

module.exports = {
    readLogs: () => {
        let logs = fs.readdirSync(path.join(os.homedir(), '/AppData/LocalLow/VRChat/VRChat'))
            .filter(x => x.startsWith('output_log_'));

        let largest = null;
        let largestStamp = 0;
        logs.forEach(logfile => {
            let date = logfile.replace('output_log_', '').replace('.txt', '');
            let d = new FormatDate(date);

            if(largestStamp < d.timestamp){
                largestStamp = d.timestamp;
                largest = logfile;
            }
        });

        return fs.readFileSync(path.join(os.homedir(), '/AppData/LocalLow/VRChat/VRChat/'+largest)).toString();
    },
    getLastWorld: ( logs ) => {
        logs = logs.split('\n');
        logs = logs.filter(x => x.includes('Entering Room: '));

        let world = 'Loading...';
        logs.forEach(l => {
            world = l.split('Entering Room: ')[1];
        })

        return world;
    },
    getUsername: ( logs ) => {
        logs = logs.split('\n');
        logs = logs.filter(x => x.includes('Initialized PlayerAPI "') && x.includes('" is local'));

        let world = 'Loading...';
        logs.forEach(l => {
            world = l.split('Initialized PlayerAPI "')[1].replace('" is local', '');
        })

        return world;
    }
}