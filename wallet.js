const bitcoin = require('bitcoinjs-lib');
const dotenv = require('dotenv');
dotenv.config();

const network = process.env.NETWORK === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

// Mock RPC client for development
const client = {
  listunspent: async () => {
    // Return mock UTXO data for testing
    return [{
      txid: '0'.repeat(64),
      vout: 0,
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      scriptPubKey: { 
        hex: '0014751e76e8199196d454941c45d1b3a323f1433bd6',
        addresses: ['tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx']
      },
      amount: 0.01 // 1,000,000 satoshis
    }];
  },
  sendrawtransaction: async (txHex) => {
    // Mock transaction broadcast
    console.log('Mock transaction broadcast:', txHex.substring(0, 20) + '...');
    return '0'.repeat(64); // Mock txid
  }
};

async function createFundingTransaction(contractAddress, amount, fundingKey) {
  const psbt = new bitcoin.Psbt({ network });
  
  // Get UTXOs from the Bitcoin node
  const utxos = await client.listunspent();
  const utxo = utxos.find(u => u.amount * 1e8 >= amount * 2);
  if (!utxo) throw new Error('Insufficient funds');
  
  // Add input from real UTXO
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    witnessUtxo: {
      script: Buffer.from(utxo.scriptPubKey.hex, 'hex'),
      value: utxo.amount * 1e8
    }
  });
  
  // Add output to contract
  psbt.addOutput({
    address: contractAddress,
    value: amount * 2
  });
  
  // Add change output if needed
  if (utxo.amount * 1e8 > amount * 2 + 1000) {
    psbt.addOutput({
      address: utxo.address,
      value: utxo.amount * 1e8 - amount * 2 - 1000 // Minus fee
    });
  }
  
  // Sign
  const keyPair = bitcoin.ECPair.fromWIF(fundingKey, network);
  psbt.signInput(0, keyPair);
  psbt.finalizeAllInputs();
  
  // Broadcast transaction
  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
  const txId = await client.sendrawtransaction(txHex);
  
  return { txId, tx };
}

async function createSettlementTransaction(contractAddress, winnerAddress, amount, keys) {
  const psbt = new bitcoin.Psbt({ network });
  
  // Find contract UTXO
  const utxos = await client.listunspent();
  const utxo = utxos.find(u => u.scriptPubKey.addresses.includes(contractAddress));
  if (!utxo) throw new Error('Contract UTXO not found');
  
  // Add input from contract
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    witnessUtxo: {
      script: bitcoin.address.toOutputScript(contractAddress, network),
      value: utxo.amount * 1e8
    }
  });
  
  // Add output to winner
  psbt.addOutput({
    address: winnerAddress,
    value: utxo.amount * 1e8 - 1000 // Minus fee
  });
  
  // Cooperative signing
  const aliceKey = bitcoin.ECPair.fromWIF(keys.alice.privateKey, network);
  const bobKey = bitcoin.ECPair.fromWIF(keys.bob.privateKey, network);
  psbt.signInput(0, aliceKey);
  psbt.signInput(0, bobKey);
  psbt.finalizeAllInputs();
  
  // Broadcast transaction
  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
  const txId = await client.sendrawtransaction(txHex);
  
  return { txId, tx };
}

module.exports = { createFundingTransaction, createSettlementTransaction };
