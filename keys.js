const bitcoin = require('bitcoinjs-lib');
const dotenv = require('dotenv');
dotenv.config();

const network = process.env.NETWORK === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

function generateKeys() {
  const alice = bitcoin.ECPair.makeRandom({ network });
  const bob = bitcoin.ECPair.makeRandom({ network });
  const oracle = bitcoin.ECPair.fromWIF(process.env.ORACLE_PRIVATE_KEY, network);
  
  return {
    alice: {
      privateKey: alice.toWIF(),
      publicKey: alice.publicKey.toString('hex')
    },
    bob: {
      privateKey: bob.toWIF(),
      publicKey: bob.publicKey.toString('hex')
    },
    oracle: {
      privateKey: oracle.toWIF(),
      publicKey: oracle.publicKey.toString('hex')
    }
  };
}

module.exports = { generateKeys };