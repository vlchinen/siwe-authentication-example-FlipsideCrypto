import axios from 'axios';
import qs from 'querystring';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';

dotenv.config();

/**
 * Flipside Crypto - Add Wallet via Dynamic Auth + SIWE
 * 
 * This script handles the authentication and wallet connection flow
 * for Flipside Crypto using Dynamic SDK and Ethereum signature.
 * 
 * Purpose: Educational portfolio project demonstrating complex OAuth + SIWE automation.
 */

const ENVIRONMENT_ID = '53aa2f96-a881-48c3-86b5-94b7b872883d';
const QUEST_URL = 'https://flipsidecrypto.xyz/earn/journey/avalanche-xsy-journey-GsPd6';
const BASE_URL = `https://app.dynamicauth.com/api/v0/sdk/${ENVIRONMENT_ID}`;
const WALLETS_API = 'https://flipsidecrypto.xyz/earn/api/wallet/add';

const CHAIN_NAME = 'avalanche';

const HEADERS = {
  'Accept': '*/*',
  'Content-Type': 'application/json',
  'Origin': 'https://flipsidecrypto.xyz',
  'Referer': 'https://flipsidecrypto.xyz/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'x-dyn-environment-id': ENVIRONMENT_ID,
  'x-dyn-api-version': 'API/0.0.586',
  'x-dyn-version': 'WalletKit/3.9.11'
};

// Store cookies for auth flow
const cookies = {};

/**
 * Save cookies from response headers
 */
function saveCookies(setCookie) {
  if (setCookie) {
    setCookie.forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      cookies[name] = `${name}=${rest.join('=').split(';')[0]}`;
    });
  }
}

/**
 * Get headers with current cookies
 */
function getHeaders() {
  return {
    ...HEADERS,
    'Cookie': Object.values(cookies).join('; ')
  };
}

/**
 * Get headers for wallet-related endpoints
 */
function getWalletHeaders(cookieLogin) {
  return {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    'Origin': 'https://flipsidecrypto.xyz',
    'Referer': 'https://flipsidecrypto.xyz/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Cookie': cookieLogin
  };
}

/**
 * Create proxy agent
 */
function getProxyAgent(proxy) {
  const { host, port, auth } = proxy;
  const proxyUrl = `http://${auth.username}:${auth.password}@${host}:${port}`;
  return new HttpsProxyAgent(proxyUrl);
}

/**
 * Initialize Dynamic SDK Settings
 */
async function initSdkSettings(proxy) {
  const httpsAgent = getProxyAgent(proxy);
  const payload = {
    dynamicContextProps: {
      settings: {
        recommendedWallets: [],
        environmentId: ENVIRONMENT_ID,
        walletConnectors: ["B2e"],
        cssOverrides: ".modal-header > h1 { display: none; } .modal-header { padding: 0; } .default-footer__footer { display: none; }",
        eventsCallbacks: {},
        customPrivacyPolicy: false,
        customTermsOfServices: false,
        policiesConsentInnerComponent: false
      }
    },
    frameworkSettings: { react: { version: "18.3.1" } }
  };

  const response = await axios.post(`${BASE_URL}/sdkSettings`, payload, { 
    headers: getHeaders(), 
    httpsAgent 
  });
  saveCookies(response.headers['set-cookie']);
}

/**
 * Connect wallet to Dynamic
 */
async function connectWallet(address, proxy) {
  const httpsAgent = getProxyAgent(proxy);
  const payload = {
    address,
    chain: "EVM",
    provider: "browserExtension",
    walletName: "okxwallet",
    authMode: "connect-and-sign"
  };

  const response = await axios.post(`${BASE_URL}/connect`, payload, { 
    headers: getHeaders(), 
    httpsAgent 
  });
  saveCookies(response.headers['set-cookie']);
  return response.data;
}

/**
 * Get nonce for SIWE
 */
async function getNonce(proxy) {
  const httpsAgent = getProxyAgent(proxy);
  const response = await axios.get(`${BASE_URL}/nonce`, {
    headers: getHeaders(),
    httpsAgent
  });
  saveCookies(response.headers['set-cookie']);
  return response.data.nonce;
}

/**
 * Sign SIWE message
 */
async function signMessage(nonce, privateKey) {
  const wallet = new ethers.Wallet(privateKey);
  const address = wallet.address;
  const issuedAt = new Date().toISOString();

  const message = `flipsidecrypto.xyz wants you to sign in with your Ethereum account:\n${address}\n\nWelcome to Flipside. Signing is the only way we can truly know that you are the owner of the wallet you are connecting. Signing is a safe, gas-less transaction that does not in any way give Flipside permission to perform any transactions with your wallet.\n\nURI: ${QUEST_URL}\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${issuedAt}\nRequest ID: ${ENVIRONMENT_ID}`;

  const signature = await wallet.signMessage(message);
  return { message, signature };
}

/**
 * Verify signature with Dynamic
 */
async function verify(payload, proxy) {
  const httpsAgent = getProxyAgent(proxy);
  
  // OPTIONS request
  await axios.options(`${BASE_URL}/verify`, { headers: getHeaders(), httpsAgent });

  const response = await axios.post(`${BASE_URL}/verify`, payload, {
    headers: getHeaders(),
    httpsAgent,
    transformRequest: [(data, headers) => {
      delete headers['X-Requested-With'];
      return JSON.stringify(data);
    }]
  });
  return response.data;
}

/**
 * Add wallet to Flipside
 */
async function addWallet(address, authToken, cookieLogin, proxy) {
  const httpsAgent = getProxyAgent(proxy);
  const payload = {
    address: address,
    chain: CHAIN_NAME,
    connectorMeta: { 
      authToken: authToken,
      type: "Dynamic"
    }
  };

  const response = await axios.post(WALLETS_API, payload, {
    headers: getWalletHeaders(cookieLogin),
    httpsAgent,
    transformRequest: [(data, headers) => {
      delete headers['X-Requested-With'];
      return JSON.stringify(data);
    }]
  });
  return response.data;
}

/**
 * Main function: Verify & Add Wallet
 */
async function verifyAndAddWallet(privateKey, cookieLogin, proxy) {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;

    console.log(`🔄 Processing wallet: ${address}`);

    // Step 1: Initialize SDK
    console.log('📡 Initializing SDK settings...');
    await initSdkSettings(proxy);
    await new Promise(r => setTimeout(r, 2500));

    // Step 2: Connect wallet
    console.log('🔗 Connecting wallet...');
    await connectWallet(address, proxy);
    await new Promise(r => setTimeout(r, 2500));

    // Step 3: Get nonce
    console.log('🔑 Getting nonce...');
    const nonce = await getNonce(proxy);
    await new Promise(r => setTimeout(r, 2500));

    // Step 4: Sign message
    console.log('✍️ Signing SIWE message...');
    const { message, signature } = await signMessage(nonce, privateKey);

    // Step 5: Verify signature
    console.log('✅ Verifying signature...');
    const verifyPayload = {
      additionalWalletAddresses: [],
      chain: "EVM",
      messageToSign: message,
      network: "1",
      publicWalletAddress: address,
      signedMessage: signature,
      walletName: "okxwallet",
      walletProvider: "browserExtension"
    };

    const verifyData = await verify(verifyPayload, proxy);

    // Step 6: Add wallet to Flipside
    console.log('📌 Adding wallet to Flipside...');
    const authToken = verifyData.jwt;
    const result = await addWallet(address, authToken, cookieLogin, proxy);

    console.log('🎉 Wallet added successfully!');
    return result;

  } catch (error) {
    console.error('❌ Failed to add wallet:', error.message);
    throw error;
  }
}

/**
 * Example usage
 */
async function main() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const COOKIE_LOGIN = process.env.COOKIE_LOGIN;   // Your existing Flipside cookie
  const PROXY = {                                  // Example proxy format
    host: "ip",
    port: 8080,
    auth: { username: "user", password: "pass" }
  };

  if (!PRIVATE_KEY || !COOKIE_LOGIN) {
    console.error('❌ PRIVATE_KEY and COOKIE_LOGIN are required in .env');
    return;
  }

  try {
    await verifyAndAddWallet(PRIVATE_KEY, COOKIE_LOGIN, PROXY);
  } catch (error) {
    console.error('💥 Main process failed:', error.message);
  }
}

// Run if executed directly
if (process.argv[1] === import.meta.url) {
  main();
}

export { verifyAndAddWallet };