const OLD_EMAIL = "xxx@xxx.com"; // github上的老邮箱
const CORRECT_NAME = "qqxu"; // 新的user
const CORRECT_EMAIL = "qqxu10@126.com"; // 新邮箱

// 访问 页面 
const accessHtml = (url) => {
    const superagent = require('superagent');
    
    return new Promise((resolve, reject) => {
    	superagent.get(url).retry(3).end((err, res) => {
	        if(err) {
	            reject(err)
	        } else {
	        	resolve(res);
	        }
	    })
    });
}

/**
 * 
 * @return {*} [{ name: 'node-load-api', path: '/qqxu/node-load-api' }]
 */
const queryDom = (res) => {
    // 抓取页面信息
    const cheerio = require('cheerio');
    // 使用cheerio模块的load()方法，将htmldocument作为参数传入函数，就可以使用类似Jquery的$(selector)的方式获取页面元素
    let $ = cheerio.load(res.text);
    let arr = [];
    $('div#user-repositories-list ul li h3 a').each((idx, ele) => {
        arr.push($(ele).attr('href'));
    });
    
    const result = arr.filter(itm => {
        // 过滤自己的repo
        return itm.indexOf('qqxu');
    }).map((itm) => {
        return {
            name: itm.split('/qqxu/')[1],
            path: itm,
        };
    });
    return result;
}

const cloneRepo = (repoName, repoPath) => {
    const shell = require('shelljs')
    const path = `git@github.com:${repoPath}.git`
    shell.exec(`git clone --bare ${path} \
    && cd ${repoName}.git \
    &&
    git filter-branch --env-filter '
    OLD_EMAIL=${OLD_EMAIL}
    CORRECT_NAME=${CORRECT_NAME}
    CORRECT_EMAIL=${CORRECT_EMAIL}
    if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
    then
        export GIT_COMMITTER_NAME="$CORRECT_NAME"
        export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
    fi
    if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
    then
        export GIT_AUTHOR_NAME="$CORRECT_NAME"
        export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
    fi
    ' --tag-name-filter cat -- --branches --tags \
    && git push --force --tags origin 'refs/heads/*' \
    `);
}


const main = async () => {
	const githubHtml = await accessHtml('https://github.com/qqxu?tab=repositories');
    const allRepository = queryDom(githubHtml);
    allRepository.forEach(({name, path}) => {
        cloneRepo(name, path);
    })
}

main();
