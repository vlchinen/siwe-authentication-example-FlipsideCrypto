# Wallet Binding Flow Analysis

## Overview

Research prototype analyzing Flipside wallet connection flow using Dynamic SDK,
Sign-In with Ethereum (SIWE), and wallet binding APIs.

## Flow

Existing Authentication Session

↓

Dynamic SDK Initialization

↓

Wallet Connection Request

↓

Nonce Generation

↓

SIWE Message Construction

↓

Ethereum Signature

↓

Dynamic Signature Verification

↓

JWT Generation

↓

Wallet Binding API Request


## Observed Components

### Dynamic SDK

The authentication flow relies on Dynamic SDK backend endpoints for:

- SDK initialization
- Wallet connection state
- Nonce generation
- Signature verification


### SIWE Authentication

The wallet ownership verification uses a signed Ethereum message containing:

- Wallet address
- Domain
- URI
- Chain ID
- Nonce
- Timestamp


### Wallet Binding

After successful signature verification, the returned authentication token
is used to associate the wallet with the existing Flipside account.


## Research Notes

The main challenge was reconstructing the complete client-side authentication
sequence without relying on the original frontend SDK flow.

The process required tracking:

- API endpoints
- Required headers
- Cookie state
- Nonce lifecycle
- Signature payload format