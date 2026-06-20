# SIWE Authentication Flow Analysis

## Overview

Research prototype analyzing the authentication flow used by Flipside Crypto.

The investigation focuses on how Ethereum wallet authentication is integrated
with Sign-In with Ethereum (SIWE) and OAuth/OIDC authorization.


## Authentication Flow

Wallet Initialization

↓

Login Redirect

↓

OAuth Authorization Flow

↓

SIWE Connection Request

↓

Generate SIWE Message

↓

Wallet Signature

↓

Signature Verification

↓

OAuth Callback

↓

Session Establishment


## Observed Components

### Wallet Layer

The client creates an Ethereum wallet instance and signs a SIWE message
using the wallet private key.


### SIWE Layer

The authentication message follows the Sign-In with Ethereum format,
including:

- Domain
- Wallet address
- URI
- Chain ID
- Nonce
- Timestamp
- Resources


### OAuth/OIDC Layer

After signature generation, the flow continues through an OAuth/OIDC
authorization sequence involving:

- Redirect handling
- State parameters
- Authorization codes
- Callback processing


### Session Layer

The final stage handles authentication state through cookies and redirects,
resulting in an authenticated session.


## Research Notes

The authentication process is not a single API request.

The complete login sequence requires maintaining:

- Redirect locations
- Cookies
- OAuth state values
- Nonce values
- Signed wallet messages


## Conclusion

This research demonstrates how wallet-based authentication systems combine
blockchain signatures with traditional OAuth/OIDC authorization flows.