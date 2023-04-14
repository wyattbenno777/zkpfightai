# ZKP_FIGHT_AI
Our goal is to help users differentiate between authentic human-created digital content and AI-generated fakes. We'll achieve this by utilizing a new ZKECDSA scheme, which can be found [here](https://github.com/personaelabs/spartan-ecdsa). A detailed explanation of this scheme can be found in this [write-up](https://personaelabs.org/posts/spartan-ecdsa/). This approach allows devices holding private keys to sign within a group of public keys without exposing sensitive information. For the ETHGlobal Tokyo hackathon, we will use the 'control of ETH address'  method, despite its slower user time, to ensure a better user interface.

## Motivation
AI can process content from audio sources and replicate human voices convincingly. This can lead to impersonation, misinformation, or worse, across various media types. Our challenge is to determine the authenticity of content and discern whether it is AI-generated or not. Find more motivation in this [Thread](https://twitter.com/wyatt_benno/status/1646725297172258819?s=20).

## How it works
TBD

## Node.js

Recommended: v18 or later

### Install dependencies

```
yarn
```

### Start server

```
yarn dev
```
