let statusMenu = document.querySelector('.status-menu');
let sideMenu = document.querySelector('.side-menu');
let worldName = document.querySelector('.side-menu-world');
let accInfo = document.querySelector('.acc-info');
let oscStatus = document.querySelector('.window-version');
let bodies = document.querySelectorAll('.body');
let bg = document.querySelector('#background');

let repos = [ 'https://cdn.phaze.gay/phaze-the-dumb/plugin-repo' ];

fetch('http://127.0.0.1:8085/config.json')
    .then(data => data.json())
    .then(data => {
        repos = data.pluginRepos;
        renderRepos();
    })

setInterval(() => {
    fetch('http://127.0.0.1:8085/gamerunning.json').then(data => data.json()).then(data => {
        if(data.running){
            statusMenu.style.bottom = '-60px';

            if(data.world){
                worldName.innerHTML = data.world;
                sideMenu.style.right = '0px';
            }

            if(data.username)
                accInfo.innerHTML = 'Logged In As: ' + data.username;
        } else{
            statusMenu.style.bottom = '0px';
            sideMenu.style.right = '-360px';
        }

        oscStatus.innerHTML = 'OSC Status: ' + data.oscstatus.text;
    })
}, 1000);

let goTo = ( index ) => {
    bodies.forEach((b, i) => {
        if(i > index)
            return b.style.top = '-100%';

        b.style.top = '-' + ( index - i ) * 100 + '%'
    })
}

let ctx = bg.getContext('2d');

bg.width = window.innerWidth;
bg.height = window.innerHeight;

window.onresize = () => {
    bg.width = window.innerWidth;
    bg.height = window.innerHeight;
    renderBG();
}

let linePos = [
    [
        (window.innerWidth / 2) * Math.random(),
        (window.innerWidth / 2) * Math.random()
    ],
    [
        (window.innerWidth / 2) * Math.random(),
        ((window.innerWidth / 2) * Math.random()) + (window.innerWidth / 2)
    ],
    [
        ((window.innerWidth / 2) * Math.random()) + (window.innerWidth / 2),
        (window.innerWidth / 2) * Math.random()
    ]
]

let renderBG = () => {
    ctx.clearRect(0, 0, bg.width, bg.height);
    ctx.strokeStyle = '#AAA';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(bg.width, 50);
    ctx.arc(100, 100, 50, -0.5 * Math.PI, 1 * Math.PI, true);
    ctx.lineTo(50, bg.height);
    ctx.lineTo(bg.width, bg.height);
    ctx.lineTo(bg.width, 50);
    ctx.clip();
    ctx.closePath();

    for(let i = 0; i < 3; i++){
        let xTop = linePos[i][0];
        let xBottom = linePos[i][1];

        for (let l = 0; l < 5; l++) {
            ctx.beginPath();
            ctx.moveTo(xTop + 40 * l, 0);
            ctx.lineTo(xBottom + 40 * l, bg.height);
            ctx.stroke();
            ctx.closePath();
        }
    }
}

let renderRepos = () => {
    let repoHTML = '';

    repos.forEach(r => {
        repoHTML += '<div class="repo-link">'+r+'<span class="remove-button" onclick="removeRepo(\''+r+'\')">-</span></div>'
    })

    document.querySelector('.repo-list').innerHTML = repoHTML;
}

let removeRepo = ( url ) => {
    repos = repos.filter(x => x !== url);
    renderRepos();

    fetch('http://127.0.0.1:8085/removeRepo?'+url);

    document.querySelector('.repo-confirm').innerHTML = 'Removed Repo: '+url;
    document.querySelector('.repo-confirm').style.opacity = '1';
    document.querySelector('.repo-confirm').style.borderRadius = '0 0 20px 20px';
    document.querySelector('.repo-add').style.borderRadius = '0';

    setTimeout(() => {
        document.querySelector('.repo-confirm').style.opacity = '0';
        document.querySelector('.repo-confirm').style.borderRadius = '20px';
        document.querySelector('.repo-add').style.borderRadius = '0 0 20px 20px';
    }, 5000);
}

let addRepo = ( url ) => {
    if(url === '')return;

    if(repos.indexOf(url) !== -1){
        document.querySelector('.repo-confirm').innerHTML = 'Repo is already added.';
        document.querySelector('.repo-confirm').style.opacity = '1';
        document.querySelector('.repo-confirm').style.borderRadius = '0 0 20px 20px';
        document.querySelector('.repo-add').style.borderRadius = '0';

        setTimeout(() => {
            document.querySelector('.repo-confirm').style.opacity = '0';
            document.querySelector('.repo-confirm').style.borderRadius = '20px';
            document.querySelector('.repo-add').style.borderRadius = '0 0 20px 20px';
        }, 5000);
        return;
    }

    if(!url.endsWith('/'))
        url += '/';

    console.log('Fetching '+url+'meta.json');
    fetch(url + 'meta.json').then(data => data.json()).then(data => {
        console.log(data);

        if(!data.name || !data.author || !data.plugins){
            document.querySelector('.repo-confirm').innerHTML = 'Not a vaild repo.';
            document.querySelector('.repo-confirm').style.opacity = '1';
            document.querySelector('.repo-confirm').style.borderRadius = '0 0 20px 20px';
            document.querySelector('.repo-add').style.borderRadius = '0';

            setTimeout(() => {
                document.querySelector('.repo-confirm').style.opacity = '0';
                document.querySelector('.repo-confirm').style.borderRadius = '20px';
                document.querySelector('.repo-add').style.borderRadius = '0 0 20px 20px';
            }, 5000);
            return;
        }

        repos.push(url);
        document.querySelector('.repo-add').value = '';

        fetch('http://127.0.0.1:8085/addRepo?'+url);
        renderRepos();

        document.querySelector('.repo-confirm').innerHTML = 'Added '+data.name+' by '+data.author;
        document.querySelector('.repo-confirm').style.opacity = '1';
        document.querySelector('.repo-confirm').style.borderRadius = '0 0 20px 20px';
        document.querySelector('.repo-add').style.borderRadius = '0';
    
        setTimeout(() => {
            document.querySelector('.repo-confirm').style.opacity = '0';
            document.querySelector('.repo-confirm').style.borderRadius = '20px';
            document.querySelector('.repo-add').style.borderRadius = '0 0 20px 20px';
        }, 5000);
    }).catch(e => {
        console.error(e);

        document.querySelector('.repo-confirm').innerHTML = 'Not a vaild repo.';
        document.querySelector('.repo-confirm').style.opacity = '1';
        document.querySelector('.repo-confirm').style.borderRadius = '0 0 20px 20px';
        document.querySelector('.repo-add').style.borderRadius = '0';

        setTimeout(() => {
            document.querySelector('.repo-confirm').style.opacity = '0';
            document.querySelector('.repo-confirm').style.borderRadius = '20px';
            document.querySelector('.repo-add').style.borderRadius = '0 0 20px 20px';
        }, 5000);
        return;
    })
}

let reloadRepos = () => {
    fetch('http://127.0.0.1:8085/reloadRepos').then(data => data.json()).then(data => {
        console.log(data);

        let text = '';

        for(let i = 0; i < data.length; i++) {
            let repo = data[i];

            for(let j = 0; j < repo.plugins.length; j++) {
                let plugin = repo.plugins[j];

                text += `<div class="app" id="app-${plugin.name}:${repo.name}">
                    <div class="app-title">${plugin.name} <span class="app-repo">${repo.name}: ${repo.author}</span></div>
                    <div class="app-desc">${plugin.description}</div>
                    <div class="button-row">
                        <div class="install-button">Install</div>
                        <div class="settings-button" style="display: none;"><div class="settings-button-hover"></div></div>
                    </div>
                </div>`
            }
        }

        document.querySelector('.apps-container').innerHTML = text;
    })
}

let fetchReposFromCache = () => {
    fetch('http://127.0.0.1:8085/repos.json').then(data => data.json()).then(data => {
        console.log(data);

        let text = '';

        for(let i = 0; i < data.length; i++) {
            let repo = data[i];

            for(let j = 0; j < repo.plugins.length; j++) {
                let plugin = repo.plugins[j];

                text += `<div class="app" id="app-${plugin.name}:${repo.name}">
                    <div class="app-title">${plugin.name} <span class="app-repo">${repo.name}: ${repo.author}</span></div>
                    <div class="app-desc">${plugin.description}</div>
                    <div class="button-row">
                        <div class="install-button">Install</div>
                        <div class="settings-button" style="display: none;"><div class="settings-button-hover"></div></div>
                    </div>
                </div>`
            }
        }

        document.querySelector('.apps-container').innerHTML = text;
    })
}

goTo(0);
renderBG();
fetchReposFromCache();