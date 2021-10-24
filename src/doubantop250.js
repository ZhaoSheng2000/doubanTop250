const puppeteer = require('puppeteer');
const fs = require('fs');



// 豆瓣top250电影
async function top250(i) {
    const browser = await puppeteer.launch({
        headless: false, //关闭无头模式
        defaultViewport: {
            width: 1200,
            height: 800
        },
        timeout: 60000
    });
    const page = await browser.newPage();
    await page.goto(`https://movie.douban.com/top250?start=0&filter=`);
    let alldata = [];
    alldata = alldata.concat(await getdata(page));

    for (let i = 0; i < 5; i++) { //控制翻页
        // 翻页
        await Promise.all([
            page.waitForNavigation(),
            page.click(' div > div.article > div.paginator > span.next > a', { delay: 1000 }),
        ]);
        alldata = alldata.concat(await getdata(page)); //封装getdata函数
        console.log(`第${i + 2}页已记录`,'color:#0f0;');
    }

    fs.writeFile(`./output/doubantop250.json`, JSON.stringify(alldata), err => {
        if (err) return console.log("写入文件失败" + err.message);
        console.log('写入成功');
    })

    page.close();
    console.log("窗口关闭，任务完成");
    browser.close();
}


async function getdata(page) {
    let titles = await page.$$eval('div > div.info > div.hd > a > span:nth-child(1)', titles =>
        titles.map(x => {
            return {
                title: x.innerText
            }
        })
    )
    let details = [];
    // 点击进去的详情页面
    for (let i = 1; i < 26; i++) {
        await Promise.all([
            page.waitForNavigation(),
            page.click(`ol > li:nth-child(${i}) div > div.info > div.hd > a`),
        ]);
        // 跳转后的页面的详情介绍
        // 判断介绍是否展开
        const zk = await page.$('#link-report > span.short > a')
        if (zk) {
            await page.click('#link-report > span.short > a');//展开全部按钮
            let detail = await page.$$eval('#link-report > span.all.hidden', items =>
                items.map(x => {
                    return {
                        detail: x.innerText
                    }
                })
            )
            details = details.concat(detail[0]);
            console.log(`第${i}个详情已采集`);
            // console.log(detail);
        } else {
            let detail = await page.$$eval('#link-report > span:nth-child(1)', items =>
                items.map(x => {
                    return {
                        detail: x.innerText
                    }
                })
            )
            details = details.concat(detail[0]);
            console.log(`第${i}个详情已采集`);
            // console.log(detail);
        }
        await page.goBack();
    }
    let score = await page.$$eval('div > div.info > div.bd > div > span.rating_num', items => items.map(item => {
        return {
            score: item.innerText
        }
    }))
    let img = await page.$$eval('div > div.article > ol > li:nth-child(n) > div > div.pic > a > img', items => items.map(item => {
        return {
            img: item.src
        }
    }))
    let comment = await page.$$eval('p.quote > span', items => items.map(x => {
        return {
            comment: x.innerText
        }
    }))
    let id = await page.$$eval('div > div.pic > em', items => items.map(x => {
        return {
            id: x.innerText
        }
    }))
    for (let item in titles) {
        Object.assign(titles[item], id[item], score[item], img[item], comment[item],details[item])
    }
    return titles

}

top250();//执行

