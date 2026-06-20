import axios from 'axios';
import qs from 'querystring';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Flipside Crypto - Full Automated Authentication Flow (SIWE + OAuth)
 * 
 * Automates the complete login process using Ethereum signature.
 * Note: The platform has been shut down. Script kept for educational and archival purposes only.
 */

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY is required. Please add it to your .env file.');
  process.exit(1);
}

const wallet = new ethers.Wallet(PRIVATE_KEY);
const walletAddress = wallet.address;

console.log(`🔑 Using wallet: ${walletAddress}`);
console.log('🚀 Starting Flipside Crypto full authentication flow...\n');

/**
 * Main Authentication Flow - 10 Steps
 */
async function startAuthFlow() {
  const questUrl = 'https://flipsidecrypto.xyz/earn/quest/vault-strategy-xo6ee4';
  let cookies = [];
  let locations = {};

  try {
    // ==================== STEP 1 ====================
    console.log('📍 Step 1: Initial login redirect...');
    try {
      await axios.get('https://flipsidecrypto.xyz/home/login?screen_hint=signup', {
        headers: {
          'Referer': questUrl,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step1 = error.response.headers.location;
        if (error.response.headers['set-cookie']) {
          cookies = cookies.concat(error.response.headers['set-cookie']);
        }
        console.log('✅ Step 1 completed');
      } else {
        throw new Error(`Step 1 failed: ${error.message}`);
      }
    }

    // ==================== STEP 2 ====================
    console.log('📍 Step 2: Following first redirect...');
    try {
      await axios.get(locations.step1, {
        headers: {
          'Referer': questUrl,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step2 = error.response.headers.location;
        if (error.response.headers['set-cookie']) cookies = cookies.concat(error.response.headers['set-cookie']);
        console.log('✅ Step 2 completed');
      } else throw error;
    }

    // ==================== STEP 3 ====================
    console.log('📍 Step 3: Continuing redirect chain...');
    try {
      await axios.get(locations.step2, {
        headers: {
          'Referer': 'https://flipsidecrypto.xyz/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step3 = error.response.headers.location;
        if (error.response.headers['set-cookie']) cookies = cookies.concat(error.response.headers['set-cookie']);
        console.log('✅ Step 3 completed');
      } else throw error;
    }

    // ==================== STEP 4 ====================
    console.log('📍 Step 4: Submitting SIWE connection...');
    const state = new URLSearchParams(locations.step3.split('?')[1]).get('state');
    const payload = { state, connection: 'siwe' };

    try {
      await axios.post('https://login.flipsidecrypto.xyz/u/login', qs.stringify(payload), {
        headers: {
          'Referer': `https://login.flipsidecrypto.xyz${locations.step3}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step4 = error.response.headers.location;
        console.log('✅ Step 4 completed');
      } else throw error;
    }

    // ==================== STEP 5 ====================
    console.log('📍 Step 5: Following redirect after SIWE init...');
    try {
      await axios.get(locations.step4, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step5 = error.response.headers.location;
        if (error.response.headers['set-cookie']) cookies = cookies.concat(error.response.headers['set-cookie']);
        console.log('✅ Step 5 completed');
      } else throw error;
    }

    // ==================== STEP 6: SIWE SIGNATURE ====================
    console.log('📍 Step 6: Signing SIWE message...');
    const params = new URLSearchParams(locations.step5.split('?')[1]);
    const nonce = params.get('nonce');
    const redirectUri = params.get('redirect_uri');
    const clientId = params.get('client_id');
    const state6 = params.get('state');

    const messageObj = {
      domain: 'oidc.login.xyz',
      address: walletAddress,
      statement: 'You are signing-in to oidc.login.xyz.',
      uri: 'https://oidc.login.xyz',
      version: '1',
      chainId: 1,
      nonce: nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      resources: [redirectUri]
    };

    const messageString = [
      `${messageObj.domain} wants you to sign in with your Ethereum account:`,
      messageObj.address,
      '',
      messageObj.statement,
      '',
      `URI: ${messageObj.uri}`,
      `Version: ${messageObj.version}`,
      `Chain ID: ${messageObj.chainId}`,
      `Nonce: ${messageObj.nonce}`,
      `Issued At: ${messageObj.issuedAt}`,
      `Expiration Time: ${messageObj.expirationTime}`,
      'Resources:',
      `- ${messageObj.resources[0]}`
    ].join('\n');

    const signature = await wallet.signMessage(messageString);
    console.log('✅ SIWE message signed successfully');

    const siweCookieData = {
      message: messageObj,
      raw: { ...messageObj },
      signature: signature
    };

    const cookieString = `siwe=${encodeURIComponent(JSON.stringify(siweCookieData))}; ${cookies.join('; ')}`;

    const signInUrl = `https://oidc.login.xyz/sign_in?redirect_uri=https://login.flipsidecrypto.xyz/login/callback&state=${state6}&client_id=${clientId}`;

    try {
      await axios.get(signInUrl, {
        headers: {
          'Referer': locations.step5,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookieString
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step6 = error.response.headers.location;
        console.log('✅ Step 6 completed');
      } else throw error;
    }

    // ==================== STEP 7 ====================
    console.log('📍 Step 7: Handling callback...');
    const params7 = new URLSearchParams(locations.step6.split('?')[1]);
    const code = params7.get('code');
    const state7 = params7.get('state');
    const callbackUrl = `https://login.flipsidecrypto.xyz/login/callback?code=${code}&state=${state7}`;

    try {
      await axios.get(callbackUrl, {
        headers: {
          'Referer': 'https://oidc.login.xyz/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step7 = error.response.headers.location;
        if (error.response.headers['set-cookie']) cookies = cookies.concat(error.response.headers['set-cookie']);
        console.log('✅ Step 7 completed');
      } else throw error;
    }

    // ==================== STEP 8 ====================
    console.log('📍 Step 8: Final login redirect...');
    try {
      await axios.get(`https://login.flipsidecrypto.xyz${locations.step7}`, {
        headers: {
          'Referer': 'https://oidc.login.xyz/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step8 = error.response.headers.location;
        console.log('✅ Step 8 completed');
      } else throw error;
    }

    // ==================== STEP 9 ====================
    console.log('📍 Step 9: Accepting consent...');
    const state9 = new URLSearchParams(locations.step8.split('?')[1]).get('state');
    const consentPayload = {
      state: state9,
      audience: 'https://dev-69tszful.us.auth0.com/api/v2/',
      scope: 'openid profile email',
      action: 'accept'
    };

    try {
      await axios.post(`https://login.flipsidecrypto.xyz/u/consent?state=${state9}`, qs.stringify(consentPayload), {
        headers: {
          'Referer': `https://login.flipsidecrypto.xyz${locations.step8}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://login.flipsidecrypto.xyz',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step9 = error.response.headers.location;
        console.log('✅ Step 9 completed');
      } else throw error;
    }

    // ==================== STEP 10 ====================
    console.log('📍 Step 10: Resuming authorization...');
    const state10 = new URLSearchParams(locations.step9.split('?')[1]).get('state');
    const resumeUrl = `https://login.flipsidecrypto.xyz/authorize/resume?state=${state10}`;

    try {
      await axios.get(resumeUrl, {
        headers: {
          'Referer': `https://login.flipsidecrypto.xyz${locations.step8}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0,
        validateStatus: status => status < 400
      });
    } catch (error) {
      if (error.response?.status === 302) {
        locations.step10 = error.response.headers.location;
        console.log('✅ Step 10 completed - Final redirect received');
      } else {
        console.log('⚠️ Step 10: Unexpected response but may still be successful');
      }
    }

    console.log('\n🎉 All 10 steps completed successfully!');
    console.log('📊 Final Locations Summary:', locations);

  } catch (error) {
    console.error('💥 Error during authentication flow:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

// Execute
startAuthFlow();