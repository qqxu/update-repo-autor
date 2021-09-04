/**
 * @description: 访问页面
 * @param {url} string
 * @return {Promise}
 */
const accessHtml = (url) => {
    // url 的响应是html
    const superagent = require('superagent');
    console.log('1');
    return new Promise((resolve, reject) => {
    	superagent.get(url).retry(3).end((err, res) => {
            
	        if(err) {
                console.log('2 err');
	            reject(err)
	        } else {
                console.log('2 success');
	        	resolve(res);
	        }
	    })
    });
}


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
    OLD_EMAIL="xuqiongqiong@lattebank.com"
    CORRECT_NAME="qqxu"
    CORRECT_EMAIL="qqxu10@126.com"
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
