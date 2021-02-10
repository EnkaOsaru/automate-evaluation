const { Evaluator } = require('./evaluator');

(async () => {
    const evaluators = new Array(+process.argv[2]);

    for (let i = 0; i < evaluators.length; i++) {
        evaluators[i] = new Evaluator(i);
    }

    await Promise.all(evaluators.map(e => e.launch()));
})();