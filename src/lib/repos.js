const RepoData = require('./repodata.js');

let fetchRepos = ( config ) => {
    console.log('Fetching repositories...');
    return new Promise(r => {
        let repoDatas = [];

        let getRepo = ( i, cb ) => {
            if(!config.pluginRepos[0])return;

            RepoData.from(config.pluginRepos[i]).then(repo => {
                repoDatas.push(repo);

                if(config.pluginRepos[i + 1])
                    getRepo(i + 1, cb);
                else cb();
            });
        }

        getRepo(0, () => {
            r(repoDatas);
        });
    })
}

module.exports = { fetchRepos };