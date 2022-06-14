module.exports = function (RED) {
    const { getChainIndex, getScale } = require('../util.js');

    function ckksSquare(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const isRescale = config.rescale;
        const flowContext = node.context().flow;

        node.status({ fill: 'grey', shape: 'ring' });

        node.on('input', function (msg) {
            const SEALContexts = flowContext.get(msg.contextName);

            try {
                if (!SEALContexts) {
                    throw new Error(`SEAL Contexts not found`);
                } else if (!msg.payload.cipherText) {
                    throw new Error(`CipherText not found`);
                } else {
                    const context = SEALContexts.context;
                    const evaluator = SEALContexts.evaluator;
                    const relinKey = SEALContexts.relinKey;
                    const scale = SEALContexts.scale;

                    const cipherText = msg.payload.cipherText;

                    evaluator.square(cipherText, cipherText);
                    evaluator.relinearize(cipherText, relinKey, cipherText);

                    if (isRescale) {
                        evaluator.rescaleToNext(cipherText, cipherText);
                        cipherText.setScale(scale);
                    }

                    const chainIndex = getChainIndex(cipherText, context);
                    const currentScale = getScale(cipherText);

                    node.status({
                        fill: 'green',
                        shape: 'dot',
                        text: `ChainIndex: ${chainIndex}, Scale: ${currentScale}`,
                    });

                    msg.payload = { cipherText: cipherText };
                    node.send(msg);
                }
            } catch (err) {
                node.error(err, msg);
                node.status({ fill: 'red', shape: 'ring', text: err });
            }
        });
    }

    RED.nodes.registerType('ckks-square', ckksSquare);
};
