const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generateKeys } = require('./keys');
const { fetchBitcoinPrice } = require('./oracle');
const { createPredictionContract } = require('./contract');
const { createFundingTransaction, createSettlementTransaction } = require('./wallet');
const { createDisputeTransaction } = require('./dispute');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a new prediction market
app.post('/create-market', async (req, res) => {
  try {
    const { threshold, amount = 100000 } = req.body;
    
    // Generate keys
    const keys = generateKeys();
    
    // Create contract
    const contract = createPredictionContract(
      keys.alice.publicKey,
      keys.bob.publicKey,
      keys.oracle.publicKey,
      threshold,
      `BTC-${new Date().getFullYear() + 1}`
    );
    
    // Create funding transaction
    const { txId } = await createFundingTransaction(
      contract.address,
      amount,
      keys.alice.privateKey
    );
    
    res.status(201).json({
      success: true,
      market: {
        id: txId,
        contract: {
          address: contract.address,
          threshold
        },
        keys: {
          alice: keys.alice,
          bob: keys.bob
        },
        fundingTxId: txId
      }
    });
  } catch (error) {
    console.error('Error creating market:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current Bitcoin price
app.get('/api/price', async (req, res) => {
  try {
    const priceData = await fetchBitcoinPrice();
    res.status(200).json({
      success: true,
      price: priceData.price,
      timestamp: priceData.timestamp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
