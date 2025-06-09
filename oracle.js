const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function fetchBitcoinPrice() {
  try {
    const response = await axios.get(process.env.COINGECKO_API_URL, {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd',
        precision: 2
      }
    });
    return {
      price: response.data.bitcoin.usd,
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    throw new Error(`Error fetching oracle data: ${error.message}`);
  }
}

module.exports = { fetchBitcoinPrice };