# Tokyo Hackathon: ZKP_FIGHT_AI

The aim of this project is to help users distinguish between genuine human-created digital content and AI-generated fakes. We will achieve this by leveraging a new ZKECDSA scheme, which can be found in this [repository](https://github.com/personaelabs/spartan-ecdsa). You can find a comprehensive explanation of the scheme in this [write-up](https://personaelabs.org/posts/spartan-ecdsa/). This approach allows devices with private keys to sign within a group of public keys without revealing sensitive information. For the ETHGlobal Tokyo hackathon, we will use the 'control of ETH address' method for a better user experience, despite its slower response time.

Both BTC and ETH utilize ECDSA signatures, which offers numerous benefits in terms of usage and tooling.

## Motivation

AI has the ability to process content from audio sources and convincingly replicate human voices. This can lead to impersonation, misinformation, or worse, across a variety of media formats. Our challenge is to establish the authenticity of content and determine whether it is AI-generated or not. Find more motivation in this [Twitter thread](https://twitter.com/wyatt_benno/status/1646725297172258819?s=20).

## How it works

Spartan-ecdsa is the fastest open-source method to verify secp256k1 ECDSA signatures in zero-knowledge.

Users can visit ZKPfightAI and post a link to their media. They can sign using either a private key or their ETH address via MetaMask or another tool. A proof is generated, which can be verified by anyone using their browser. By providing a human-authenticated ZKBadge and URL, users can confirm that the content they are viewing has been verified.

Hardware devices, such as cameras and phones, could have private keys uploaded to them. Since we do not want to expose any single key in the group of device keys, we would use this ZKECDSA method. There is an interesting video on ZKP for misinformation prevention on [YouTube](https://www.youtube.com/watch?app=desktop&v=MwTK6ZQhOQg&t=2956s).

## Blockchain

Hosting proofs and verifying them on-chain is a trustless way for anyone to confirm the source of information. As artificial intelligence becomes more advanced, blockchain with ZKP will play a significant role in preventing deep-fakes and misinformation. ZKP that run fast on user and resource-constrained devices will play a prominent role in protecting against fakes.

## Future work

- Reduce the number of Keccak constraints to improve the speed of Ethereum address signing.
- Investigate wrapping the final proof to make it smaller.
- Investigate making a proof of all of the proves created.
- Make an API that allows for more conditional constraints about the user account. (hasNFT, hasBalance, etc)

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
