const { generateKeys } = require('./keys');
const { fetchBitcoinPrice } = require('./oracle');
const { createPredictionContract } = require('./contract');
const { createFundingTransaction } = require('./wallet');
const bitcoin = require('bitcoinjs-lib');
const dotenv = require('dotenv');
dotenv.config();

async function runTest() {
  console.log('🚀 Starting BitVM Prediction Market Test\n');
  
  // Generate keys
  const keys = generateKeys();
  console.log('🔑 Generated keys for Alice, Bob, and Oracle');
  
  // Create contract
  const contract = createPredictionContract(
    keys.alice.publicKey,
    keys.bob.publicKey,
    keys.oracle.publicKey,
    100000, // $100,000 threshold
    'BTC-2025'
  );
  console.log('📝 Contract created at address:', contract.address);
  
  // Simulate funding
  const fundingTx = createFundingTransaction(
    contract.address, 
    100000, // 0.001 BTC each
    keys.alice.privateKey
  );
  console.log('💰 Funding transaction created');
  
  // Fetch oracle data
  try {
    const priceData = await fetchBitcoinPrice();
    console.log('🔮 Current BTC price: $', priceData.price);
    
    // Determine winner
    if (priceData.price > 100000) {
      console.log('🎉 Alice wins! (Price > $100,000)');
    } else {
      console.log('🎉 Bob wins! (Price ≤ $100,000)');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runTest();