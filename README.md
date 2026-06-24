# Flipside Crypto — Wallet Authentication Automation

Automation built for Flipside Crypto's wallet-based login and wallet-binding flow, combining SIWE wallet signatures with an Auth0-based OAuth/OIDC login sequence.

⚠️ **Note:** Flipside Crypto has since shut down. This repository is kept for educational and archival purposes — the live endpoints referenced here are no longer active.

## Overview

Flipside didn't use a simple "sign a message, get a token" flow — wallet authentication was wired into a full OAuth/OIDC login sequence (Auth0) plus a separate Dynamic SDK-based wallet-binding step. Automating it meant tracing the entire redirect chain end-to-end: each step's response determined the next request, with state, nonce, and cookies carried through ten separate steps.

## What This Covers

- **Full OAuth/OIDC login automation** (`flipside-auth.js`) — a 10-step redirect chain combining a SIWE wallet signature with Auth0 authorization, consent, and callback handling
- **Wallet binding via Dynamic SDK** (`flipside-add-wallet.js`) — connecting and associating an additional wallet to an existing account using Dynamic's SDK + SIWE
- Notes on both flows, including where OAuth/OIDC and SIWE intersect

## Approach

Most of the work here was tracing behavior rather than reading documentation — the platform didn't publish how its login sequence worked. The process was: follow each redirect manually in the browser, note what each step needed (state, nonce, cookies) and what it returned, then reproduce that sequence in code. The 10-step chain in `flipside-auth.js` took the most iteration, since a wrong assumption at any step broke everything downstream.

## Repository Structure

- `flipside-auth.js` — full SIWE + OAuth/OIDC login automation (10-step flow)
- `flipside-add-wallet.js` — wallet connection/binding via Dynamic SDK + SIWE
- `siwe-flow.md` — notes on how SIWE integrates with the OAuth/OIDC sequence
- `wallet-binding.md` — notes on the Dynamic SDK wallet-binding flow

## Disclaimer

Created for educational and archival purposes. The platform has shut down, and the endpoints referenced here are no longer active. No private keys, credentials, or production secrets are included.