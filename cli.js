#!/usr/bin/env node
const inquirer = require('inquirer');
const ora = require('ora');
const { generateKeys } = require('./keys');
const { createPredictionContract } = require('./contract');
const { createFundingTransaction } = require('./wallet');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  console.log('🌟 BitVM Prediction Market CLI\n');
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices: [
        'Create new prediction market',
        'Join existing market',
        'Settle prediction',
        'Resolve dispute',
        'Exit'
      ]
    }
  ]);
  
  if (action === 'Create new prediction market') {
    await createMarket();
  } else if (action === 'Exit') {
    process.exit();
  } else {
    console.log('\nThis feature is not implemented yet. Exiting.');
  }
}

async function createMarket() {
  const spinner = ora('Generating keys').start();
  const keys = generateKeys();
  spinner.succeed('Keys generated');
  
  // Get prediction details
  const { threshold } = await inquirer.prompt([
    {
      type: 'number',
      name: 'threshold',
      message: 'Enter BTC price threshold (USD):',
      default: 100000
    }
  ]);
  
  // Create contract and show details
  // ...
}

main().catch(console.error);