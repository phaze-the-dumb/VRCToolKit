const { spawn } = require('child_process');

let checkForProcess = ( name ) => {
    let promise = new Promise(( resolve, reject ) => {
        let list = spawn('tasklist');

        let tasks = '';
        list.stdout.on('data', ( chunk ) => tasks += chunk.toString());
    
        list.on('close', () => {
            let lins = tasks.split('\r\n');
            lins.shift();
            lins.shift();
            lins.shift();
    
            lins.forEach(( l, i ) => 
                lins[i] = l.split(' ')[0]);
    
            if(lins.find(x => x === name))
                resolve(true);
            else
                resolve(false);
        })
    })

    return promise;
}

module.exports = { checkForProcess };