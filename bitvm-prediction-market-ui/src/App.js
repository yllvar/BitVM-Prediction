import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [threshold, setThreshold] = useState(100000);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createMarket = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:3001/api/markets', { threshold });
      setMarket(response.data.market);
    } catch (err) {
      setError(err.response ? err.response.data.error : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>BitVM Prediction Market</h1>
      <div>
        <label>
          Enter BTC price threshold (USD):
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </label>
        <button onClick={createMarket} disabled={loading}>
          {loading ? 'Creating...' : 'Create Market'}
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {market && (
        <div>
          <h2>Market Created:</h2>
          <p>Contract Address: {market.contract.address}</p>
          <p>Threshold: ${market.contract.threshold}</p>
          <p>Funding TX ID: {market.fundingTxId}</p>
          <h3>Keys:</h3>
          <p>Alice Private Key: {market.keys.alice.privateKey}</p>
          <p>Bob Private Key: {market.keys.bob.privateKey}</p>
        </div>
      )}
    </div>
  );
}

export default App;
