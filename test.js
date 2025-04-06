import axios from 'axios';
import qs from 'querystring';
import { ethers } from 'ethers';

const privateKey = '0x9645a340932373ec20fd545e10890d200d21b638a7dd1b08dbf9cf89ad008fbb';
const wallet = new ethers.Wallet(privateKey);
const address = wallet.address;

async function startAuthFlow() {
  const questUrl = 'https://flipsidecrypto.xyz/earn/quest/vault-strategy-xo6ee4';
  let cookies = [];
  let location1, redirectUrl;

  // Bước 1
  try {
    const response1 = await axios.get(
      `https://flipsidecrypto.xyz/home/login?screen_hint=signup`,
      {
        headers: {
          'Referer': questUrl,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location1 = error.response.headers.location;
      redirectUrl = decodeURIComponent(new URLSearchParams(location1.split('?')[1]).get('redirectUrl'));
      if (error.response.headers['set-cookie']) {
        cookies = error.response.headers['set-cookie'];
      }
      console.log('Step 1 Location:', location1);
    } else {
      throw new Error(`Step 1 Error: ${error.message}`);
    }
  }

  // Bước 2
  let location2;
  try {
    const response2 = await axios.get(
      location1,
      {
        headers: {
          'Referer': questUrl,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location2 = error.response.headers.location;
      if (error.response.headers['set-cookie']) {
        cookies = cookies.concat(error.response.headers['set-cookie']);
      }
      console.log('Step 2 Location:', location2);
    } else {
      throw new Error(`Step 2 Error: ${error.message}`);
    }
  }

  // Bước 3
  let location3;
  try {
    const response3 = await axios.get(
      location2,
      {
        headers: {
          'Referer': 'https://flipsidecrypto.xyz/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location3 = error.response.headers.location;
      if (error.response.headers['set-cookie']) {
        cookies = cookies.concat(error.response.headers['set-cookie']);
      }
      console.log('Step 3 Location:', location3);
    } else {
      throw new Error(`Step 3 Error: ${error.message}`);
    }
  }

  // Bước 4
  let location4;
  try {
    const state = new URLSearchParams(location3.split('?')[1]).get('state');
    const payload = {
      state: state,
      connection: 'siwe'
    };
    const fullUrl = 'https://login.flipsidecrypto.xyz/u/login';
    const response4 = await axios.post(
      fullUrl,
      qs.stringify(payload),
      {
        headers: {
          'Referer': `https://login.flipsidecrypto.xyz${location3}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location4 = error.response.headers.location;
      console.log('Step 4 Location:', location4);
    } else {
      throw new Error(`Step 4 Error: ${error.message}`);
    }
  }

  // Bước 5
  let location5;
  try {
    const response5 = await axios.get(
      location4,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location5 = error.response.headers.location;
      if (error.response.headers['set-cookie']) {
        cookies = cookies.concat(error.response.headers['set-cookie']);
      }
      console.log('Step 5 Location:', location5);
    } else {
      throw new Error(`Step 5 Error: ${error.message}`);
    }
  }

  // Bước 6
  let location6;
  try {
    const params = new URLSearchParams(location5.split('?')[1]);
    const nonce = params.get('nonce');
    const redirectUri = params.get('redirect_uri');
    const state = params.get('state');
    const clientId = params.get('client_id');

    const messageObj = {
      domain: 'oidc.login.xyz',
      address: address,
      statement: 'You are signing-in to oidc.login.xyz.',
      uri: 'https://oidc.login.xyz',
      version: '1',
      chainId: 1,
      nonce: nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      resources: [redirectUri]
    };

    const rawObj = { ...messageObj };

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
    const siweCookie = {
      message: messageObj,
      raw: rawObj,
      signature: signature
    };
    const cookieString = `siwe=${encodeURIComponent(JSON.stringify(siweCookie))}; ${cookies.join('; ')}`;

    const signInUrl = `https://oidc.login.xyz/sign_in?redirect_uri=https://login.flipsidecrypto.xyz/login/callback&state=${state}&client_id=${clientId}`;
    const response6 = await axios.get(
      signInUrl,
      {
        headers: {
          'Referer': location5,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookieString
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location6 = error.response.headers.location;
      console.log('Step 6 Location:', location6);
    } else {
      throw new Error(`Step 6 Error: ${error.message}`);
    }
  }

  // Bước 7
  let location7;
  try {
    const params = new URLSearchParams(location6.split('?')[1]);
    const code = params.get('code');
    const state = params.get('state');
    const callbackUrl = `https://login.flipsidecrypto.xyz/login/callback?code=${code}&state=${state}`;
    const response7 = await axios.get(
      callbackUrl,
      {
        headers: {
          'Referer': 'https://oidc.login.xyz/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location7 = error.response.headers.location;
      if (error.response.headers['set-cookie']) {
        cookies = cookies.concat(error.response.headers['set-cookie']);
      }
      console.log('Step 7 Location:', location7);
    } else {
      throw new Error(`Step 7 Error: ${error.message}`);
    }
  }

  // Bước 8
  let location8;
  try {
    const fullUrl = `https://login.flipsidecrypto.xyz${location7}`;
    const response8 = await axios.get(
      fullUrl,
      {
        headers: {
          'Referer': `https://oidc.login.xyz/`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location8 = error.response.headers.location;
      console.log('Step 8 Location:', location8);
    } else {
      throw new Error(`Step 8 Error: ${error.message}`);
    }
  }

  // Bước 9
  let location9;
  try {
    const params = new URLSearchParams(location8.split('?')[1]);
    const state = params.get('state');
    const payload = {
      state: state,
      audience: 'https://dev-69tszful.us.auth0.com/api/v2/',
      scope: 'openid profile email',
      action: 'accept'
    };
    const fullUrl = `https://login.flipsidecrypto.xyz/u/consent?state=${state}`;
    const response9 = await axios.post(
      fullUrl,
      qs.stringify(payload),
      {
        headers: {
          'Referer': `https://login.flipsidecrypto.xyz${location8}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://login.flipsidecrypto.xyz',
          'Priority': 'u=0, i',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location9 = error.response.headers.location;
      console.log('Step 9 Location:', location9);
    } else {
      throw new Error(`Step 9 Error: ${error.message}`);
    }
  }

  let location10;
  try {
    // Lấy state từ location9
    const params = new URLSearchParams(location9.split('?')[1]);
    const state = params.get('state');
    const fullUrl = `https://login.flipsidecrypto.xyz/authorize/resume?state=${state}`;
  
    // Chuyển cookies thành object để dễ xử lý
    const cookieMap = cookies.reduce((acc, cookie) => {
      const [name, ...valueParts] = cookie.split('=');
      acc[name] = `${name}=${valueParts.join('=')}`; // Giữ nguyên toàn bộ cookie
      return acc;
    }, {});
  
  
    // Tạo cookie string từ cookieMap
    const cookieString = Object.values(cookieMap).join('; ');
    console.log('Step 10 Cookies Before Request:', cookieString);
  
    // Header mô phỏng trình duyệt
    const headers = {
      'Referer': `https://login.flipsidecrypto.xyz${location8}`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': cookieString,
      'Priority': 'u=0, i'
    };
  
    console.log('Step 10 Full URL:', fullUrl);
    console.log('Step 10 Request Headers:', headers);
  
    // Gửi request
    const response10 = await axios.get(fullUrl, {
      headers,
      maxRedirects: 0, // Không tự động redirect
      validateStatus: status => status < 400 // Chấp nhận 302
    });
  
    // Xử lý response
    if (response10.status === 302) {
      location10 = response10.headers.location;
      console.log('Step 10 Location:', location10);
    } else {
      console.log('Step 10 Unexpected Response:', response10.status, response10.data);
    }
  } catch (error) {
    if (error.response && error.response.status === 302) {
      location10 = error.response.headers.location;
      console.log('Step 10 Location:', location10);
    } else {
      console.error('Step 10 Error Details:', error.response?.data || error.message);
      console.log('Step 10 Response Headers:', error.response?.headers);
    }
  }
  return {
    step1: { location: location1 },
    step2: { location: location2 },
    step3: { location: location3 },
    step4: { location: location4 },
    step5: { location: location5 },
    step6: { location: location6 },
    step7: { location: location7 },
    step8: { location: location8 },
    step9: { location: location9 },
    step10: { location: location10 }
  };
}

startAuthFlow()
  .then(data => {
    console.log('Step 1 Location:', data.step1.location);
    console.log('Step 2 Location:', data.step2.location);
    console.log('Step 3 Location:', data.step3.location);
    console.log('Step 4 Location:', data.step4.location);
    console.log('Step 5 Location:', data.step5.location);
    console.log('Step 6 Location:', data.step6.location);
    console.log('Step 7 Location:', data.step7.location);
    console.log('Step 8 Location:', data.step8.location);
    console.log('Step 9 Location:', data.step9.location);
    console.log('Step 10 Location:', data.step10.location);
  })
  .catch(error => console.error('Failed:', error.message));