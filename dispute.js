const bitcoin = require('bitcoinjs-lib');
const dotenv = require('dotenv');
dotenv.config();

const network = process.env.NETWORK === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

function createDisputeTransaction(contractAddress, oracleData, keys, contract) {
  const { price, timestamp, signature } = oracleData;
  const psbt = new bitcoin.Psbt({ network });
  
  // Add input from contract
  psbt.addInput({
    hash: '0'.repeat(64), // Placeholder - would be real txid in production
    index: 0,
    witnessUtxo: {
      script: bitcoin.address.toOutputScript(contractAddress, network),
      value: 200000
    }
  });
  
  // Determine winner based on price threshold
  const isAliceWinner = price > contract.threshold;
  const winnerPubKey = isAliceWinner ? keys.alice.publicKey : keys.bob.publicKey;
  const winnerKey = isAliceWinner ? 
    bitcoin.ECPair.fromWIF(keys.alice.privateKey, network) :
    bitcoin.ECPair.fromWIF(keys.bob.privateKey, network);
  
  // Add output to winner with optimized fee calculation
  psbt.addOutput({
    address: bitcoin.payments.p2wpkh({ 
      pubkey: Buffer.from(winnerPubKey, 'hex'),
      network 
    }).address,
    value: 199000 // 200000 - 1000 (fee)
  });
  
  // Build optimized witness data
  // Use compact encoding for price data (4 bytes instead of 8)
  const priceBuffer = Buffer.alloc(4);
  priceBuffer.writeUInt32LE(price, 0);
  
  // Compact witness stack
  const witness = [
    // Dispute path selector (1 byte)
    Buffer.from([0x01]),
    // Oracle signature (compact Schnorr, 64 bytes)
    Buffer.from(signature, 'hex'),
    // Price data (4 bytes)
    priceBuffer,
    // Winner's signature placeholder (will be filled by signing)
    Buffer.alloc(64)
  ];
  
  // Set witness data
  psbt.updateInput(0, {
    witnessScript: Buffer.from(contract.disputeScript, 'hex'),
    witness
  });
  
  // Sign with winner's key using Schnorr signature
  psbt.signInput(0, winnerKey);
  psbt.finalizeAllInputs();
  
  return psbt;
}

module.exports = { createDisputeTransaction };
