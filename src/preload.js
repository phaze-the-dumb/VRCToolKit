const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.traffic-light-minimise').onclick = () => 
        ipcRenderer.send('minimise');

    // document.querySelector('.traffic-light-restore-up').onclick = () => {
    //     document.querySelector('.traffic-light-restore-up').style.display = 'none';
    //     document.querySelector('.traffic-light-restore-down').style.display = 'block';
    //     ipcRenderer.send('restore-up');
    // }

    // document.querySelector('.traffic-light-restore-down').onclick = () => {
    //     document.querySelector('.traffic-light-restore-up').style.display = 'block';
    //     document.querySelector('.traffic-light-restore-down').style.display = 'none';
    //     ipcRenderer.send('restore-down');
    // }

    document.querySelector('.traffic-light-close').onclick = () => 
        ipcRenderer.send('close');

    document.querySelector('#osc-logs-open').onclick = () => 
        ipcRenderer.send('open-osclogs');

    document.querySelector('#logs-open').onclick = () => 
        ipcRenderer.send('open-logs');
})