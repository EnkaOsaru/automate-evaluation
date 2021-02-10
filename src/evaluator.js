const puppeteer = require('puppeteer');

const IMAGE_RECTS = [
    { x: 77, y: 159, w: 61, h: 170 },
    { x: 337, y: 159, w: 61, h: 170 }
];

function sleep(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

class Evaluator {
    constructor(id) {
        this.id = id;
    }

    async launch() {
        await this.initialize();

        while (true) {
            await sleep(5000);

            const debugInfo = await this.evaluate();

            console.log(`${this.id}: ${JSON.stringify(debugInfo)}`);
        }
    }

    async initialize() {
        this.browser = await puppeteer.launch({ headless: true });

        this.page = await this.browser.newPage();

        this.page.goto('https://gamingchahan.com/ecchi/');
    }

    async evaluate() {
        const resultHandle = await this.page.waitForFunction(rects => {
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

            function rgbToHsv(r, g, b) {
                let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
                let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));
                return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
            }

            const canvas = document.querySelector('canvas');

            const losses = [];

            for (const rect of rects) {
                const imageData = getImageData(canvas, rect.x, rect.y, rect.w, rect.h);
                const { data, width, height } = imageData;

                let loss = 0;

                for (let i = 0; i < width * height; i++) {
                    const r = data[4 * i + 0] / 255;
                    const g = data[4 * i + 1] / 255;
                    const b = data[4 * i + 2] / 255;

                    loss += r;

                    // const h = rgbToHsv(r, g, b)[0] / 360;
                    // const d = (0.5 - h) ** 2;
                    // loss += d;
                }

                losses.push(loss);
            }

            const betterIndex = losses[0] < losses[1] ? 0 : 1;
            const betterRect = rects[betterIndex];
            const canvasRect = canvas.getBoundingClientRect();

            const debugInfo = {
                index: betterIndex,
                losses
            };

            return {
                x: betterRect.x + betterRect.w / 2 + canvasRect.left,
                y: betterRect.y + betterRect.h / 2 + canvasRect.top,
                debugInfo
            };
        }, {}, IMAGE_RECTS);

        const result = await resultHandle.jsonValue();

        await this.page.mouse.click(result.x, result.y, { delay: 100 });

        return result.debugInfo;
    }

    async close() {
        await this.browser.close();
    }
}

module.exports = {
    Evaluator
};