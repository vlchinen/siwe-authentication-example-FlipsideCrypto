# Flipside Web3 Authentication Research

Research prototype exploring Flipside Crypto authentication and wallet
connection flows using Ethereum signatures, SIWE, OAuth/OIDC, and Dynamic SDK.

## Overview

This repository documents the analysis and reconstruction of a Web3
authentication workflow.

The research focuses on:

- Sign-In with Ethereum (SIWE) authentication
- OAuth/OIDC authorization flow
- Dynamic SDK wallet connection flow
- Wallet binding process
- API request lifecycle and session handling


## Authentication Flow

The implemented prototype follows this sequence:

```Wallet Initialization
|
v
Authentication Session
|
v
Dynamic SDK Initialization
|
v
Wallet Connection
|
v
SIWE Nonce Request
|
v
Ethereum Message Signing
|
v
Signature Verification
|
v
Wallet Binding
```

## Technical Components

- JavaScript / Node.js
- ethers.js
- SIWE message signing
- OAuth/OIDC authorization
- Dynamic SDK API analysis
- HTTP session and cookie management


## Scripts

### flipside-auth.js

Handles the authentication flow using Ethereum wallet signatures,
including SIWE message generation and OAuth/OIDC authorization handling.


### flipside-add-wallet.js

Handles the wallet connection and binding workflow using Dynamic SDK.

The flow includes:

- SDK initialization
- Wallet connection request
- Nonce retrieval
- SIWE signature generation
- Signature verification
- Wallet association


## Research Notes

The main challenge was understanding the interaction between:

- Wallet signature authentication
- Traditional web authentication systems
- Dynamic SDK backend services
- Wallet association APIs

The project focuses on understanding authentication architecture
and request flows rather than providing a production authentication library.


## Disclaimer

Created for educational and research purposes only.

The original platform flow may change or become unavailable over time.