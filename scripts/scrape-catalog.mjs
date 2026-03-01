import https from 'https';

const baseUrl = 'https://pizzalemon.ch/lemon/image/cache/catalog/';
const foundImages = new Set();
const visited = new Set();

async function fetchDir(url) {
    if (visited.has(url)) return;
    visited.add(url);
    
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', async () => {
                const hrefRegex = /href="([^"]+)"/g;
                let match;
                const tasks = [];
                while ((match = hrefRegex.exec(body)) !== null) {
                    let href = match[1];
                    if (href === '../' || href === './') continue;
                    
                    if (href.endsWith('/')) {
                        // It's a directory
                        tasks.push(fetchDir(url + href));
                    } else if (href.includes('-220x220.')) {
                        foundImages.add(url + href);
                    }
                }
                await Promise.all(tasks);
                resolve();
            });
        }).on('error', () => resolve());
    });
}

async function run() {
    console.log('Crawling catalog...');
    await fetchDir(baseUrl);
    console.log(`Found ${foundImages.size} images size 220x220.`);
    const arr = Array.from(foundImages);
    for (const img of arr) {
        console.log(img);
    }
}

run();
