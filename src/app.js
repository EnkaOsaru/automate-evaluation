const puppeteer = require('puppeteer');

const URL = 'https://gamingchahan.com/ecchi/';

const ATTEMPT_COUNT = 100;

const RECTS = [
    {
        x: 20, y: 105,
        w: 200, h: 250
    },
    {
        x: 280, y: 105,
        w: 200, h: 250
    }
];

function sleep(duration) { return new Promise(resolve => setTimeout(resolve, duration)) };

(async () => {
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();

    await page.goto(URL);

    for (let i = 0; i < ATTEMPT_COUNT; i++) {
        await sleep(5000);

        const resultHandle = await page.waitForFunction(rects => {
            function getImageData(canvas, sx, sy, sw, sh) {
                const helperCanvas = document.createElement('canvas');
                const helperContext = helperCanvas.getContext('2d');

                document.body.append(helperCanvas);
                helperCanvas.width = canvas.width;
                helperCanvas.height = canvas.height;
                helperContext.drawImage(canvas, 0, 0);

                const imageData = helperContext.getImageData(sx, sy, sw, sh);

                helperCanvas.remove();

                return imageData;
            }

            const canvas = document.querySelector('canvas');

            const redSums = [];

            for (const rect of rects) {
                const imageData = getImageData(canvas, rect.x, rect.y, rect.w, rect.h);
                const { data, width, height } = imageData;

                let redSum = 0;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const ix = 4 * x;
                        const iy = 4 * y;

                        redSum += data[ix + iy * width];
                    }
                }

                redSums.push(redSum);
            }

            const betterIndex = redSums[0] < redSums[1] ? 0 : 1;
            const betterRect = rects[betterIndex];

            const canvasRect = canvas.getBoundingClientRect();

            return {
                x: betterRect.x + betterRect.w / 2 + canvasRect.left,
                y: betterRect.y + betterRect.h / 2 + canvasRect.top,
                redSums
            };
        }, {}, RECTS);

        const result = await resultHandle.jsonValue();

        console.log(result);

        await page.mouse.click(result.x, result.y, { delay: 100 });
    }

    await browser.close();
})();