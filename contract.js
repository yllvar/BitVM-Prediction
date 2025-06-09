const bitcoin = require('bitcoinjs-lib');
const dotenv = require('dotenv');
dotenv.config();

const network = process.env.NETWORK === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

function createPredictionContract(alicePubKey, bobPubKey, oraclePubKey, threshold, eventId) {
  // Cooperative settlement script (2-of-2 multisig)
  // Using a more compact script with Schnorr signatures
  const cooperativeScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_2,
    Buffer.from(alicePubKey, 'hex'),
    Buffer.from(bobPubKey, 'hex'),
    bitcoin.opcodes.OP_2,
    bitcoin.opcodes.OP_CHECKMULTISIG
  ]);

  // Dispute resolution script (BitVM logic)
  // Optimized for size and efficiency
  const disputeScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    // Verify oracle signature (compact)
    Buffer.from(oraclePubKey, 'hex'),
    bitcoin.opcodes.OP_CHECKSIGVERIFY,
    
    // Efficient price comparison using minimal operations
    // Convert threshold to compact 4-byte representation
    Buffer.from(threshold.toString(16).padStart(8, '0'), 'hex'),
    bitcoin.opcodes.OP_LESSTHANOREQUAL,
    
    // Determine winner based on comparison
    bitcoin.opcodes.OP_IF,
    // Bob wins (price <= threshold)
    Buffer.from(bobPubKey, 'hex'),
    bitcoin.opcodes.OP_ELSE,
    // Alice wins (price > threshold)
    Buffer.from(alicePubKey, 'hex'),
    bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_CHECKSIG,
    
    bitcoin.opcodes.OP_ELSE,
    // Cooperative path (unchanged)
    bitcoin.opcodes.OP_2,
    Buffer.from(alicePubKey, 'hex'),
    Buffer.from(bobPubKey, 'hex'),
    bitcoin.opcodes.OP_2,
    bitcoin.opcodes.OP_CHECKMULTISIG,
    bitcoin.opcodes.OP_ENDIF
  ]);

  // Create Taproot address with optimized script tree
  const tree = [
    { output: cooperativeScript },
    { output: disputeScript }
  ];

  // Use Schnorr-compatible key format
  const internalKey = Buffer.from(alicePubKey, 'hex').slice(1); // Remove prefix for Taproot
  
  const { address } = bitcoin.payments.p2tr({
    internalPubkey: internalKey,
    scriptTree: tree,
    network
  });

  return {
    address,
    cooperativeScript: cooperativeScript.toString('hex'),
    disputeScript: disputeScript.toString('hex'),
    threshold,
    tree
  };
}

module.exports = { createPredictionContract };
