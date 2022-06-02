const SEAL = require('node-seal');

module.exports = async function (RED) {
    const seal = await SEAL();
    function CKKSContext(node) {
        RED.nodes.createNode(this, node);
        const schemeType = seal.SchemeType.ckks;
        const securityLevel = seal.SecurityLevel.none;
        const polyModulusDegree = node.polyModulus;
        const bitSizes = JSON.parse(node.coeffModulus).value;
        const parms = seal.EncryptionParameters(schemeType);

        parms.setPolyModulusDegree(polyModulusDegree);
        parms.setCoeffModulus(
            seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes)),
        );

        const context = seal.Context(
            parms, // Encryption Parameters
            true, // ExpandModChain
            securityLevel, // Enforce a security level
        );

        const keyGenerator = seal.KeyGenerator(context);
        const secretKey = keyGenerator.secretKey();
        const publicKey = keyGenerator.createPublicKey();
        const relinKey = keyGenerator.createRelinKeys();
        const galoisKey = keyGenerator.createGaloisKeys();
        const encoder = seal.CKKSEncoder(context);
        const encryptor = seal.Encryptor(context, publicKey);
        const decryptor = seal.Decryptor(context, secretKey);
        const evaluator = seal.Evaluator(context);

        this.name = node.name;
        this.poluModulus = node.polyModulus;
        this.coeffModulus = node.coeffModulus;
        this.scale = Math.pow(2, node.scale);
        this.secretKey = secretKey;
        this.publicKey = publicKey;
        this.relinKey = relinKey;
        this.galoisKey = publicKey;
        this.encoder = encoder;
        this.encryptor = encryptor;
        this.decryptor = decryptor;
        this.evaluator = evaluator;
        this.context = context;
    }
    RED.nodes.registerType('ckks-context', CKKSContext);
};
