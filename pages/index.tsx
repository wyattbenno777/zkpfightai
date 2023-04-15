/*
_______  _        _______  _______ _________ _______          _________   _______ _________
/ ___   )| \    /\(  ____ )(  ____ \\__   __/(  ____ \|\     /|\__   __/  (  ___  )\__   __/
\/   )  ||  \  / /| (    )|| (    \/   ) (   | (    \/| )   ( |   ) (     | (   ) |   ) (
   /   )|  (_/ / | (____)|| (__       | |   | |      | (___) |   | |     | (___) |   | |
  /   / |   _ (  |  _____)|  __)      | |   | | ____ |  ___  |   | |     |  ___  |   | |
 /   /  |  ( \ \ | (      | (         | |   | | \_  )| (   ) |   | |     | (   ) |   | |
/   (_/\|  /  \ \| )      | )      ___) (___| (___) || )   ( |   | |     | )   ( |___) (___
(_______/|_/    \/|/_____  |/       \_______/(_______)|/     \|   )_(_____|/     \|\_______/
                  (_____)                                          (_____)
By Wyatt at ETHTOKYO 2023.
*/

import React, { useState, useEffect } from "react";
import {
  MembershipProver,
  MembershipVerifier,
  Tree,
  Poseidon,
  defaultAddressMembershipPConfig,
  defaultPubkeyMembershipPConfig,
  defaultPubkeyMembershipVConfig,
  defaultAddressMembershipVConfig
} from "@personaelabs/spartan-ecdsa";
import {
  ecrecover,
  ecsign,
  hashPersonalMessage,
  privateToAddress,
  privateToPublic,
  pubToAddress
} from "@ethereumjs/util";

export default function Home() {

  const privateKey = Buffer.from("".padStart(16, "🐱"), "utf16le");
  const [proverAddressString, setProverAddressString] = useState("0x" + privateToAddress(privateKey).toString("hex"));

  const getProverAddress = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = accounts[0];
        console.log("Connected account:", account);
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      console.log("MetaMask is not installed");
    }
  }

  useEffect(() => {
      async function getProverAddress() {
          if (typeof window.ethereum !== "undefined") {
              try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                const account = accounts[0];
                setProverAddressString(account);
              } catch (error) {
                console.error("User denied account access");
              }
          } else {
              console.log("MetaMask is not installed");
          }
      }

      getProverAddress();
  }, []);

  const proverAddressMembership = async () => {

      const message = Buffer.from("I am human");
      const messageHash = hashPersonalMessage(message);

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: ["I am human", proverAddressString],
      });

      const hasher = new Poseidon();
      await hasher.initWasm();

      const depth = 20;
      const addressTree = new Tree(depth, hasher);

      addressTree.insert(BigInt(proverAddressString));

      for (const member of ["🐻", "🐶", "🐼"]) {
        const key = privateToPublic(
          Buffer.from("".padStart(16, member), "utf16le")
        );
        const address = BigInt("0x" + pubToAddress(key).toString("hex"));
        addressTree.insert(address);
      }

      const idx = addressTree.indexOf(BigInt(proverAddressString));
      const proof = addressTree.createProof(idx);

      console.log("Proving...");

      const membershipProver = new MembershipProver({
        ...defaultAddressMembershipPConfig,
        enableProfiler: true
      });

      await membershipProver.initWasm();

      const { proof: zkProof, publicInput } = await membershipProver.prove(
        signature,
        messageHash,
        proof
      );

      console.timeEnd("Full proving time");
      console.log(
        "Raw proof size (excluding public input)",
        zkProof.length,
        "bytes"
      );

      return;

      console.log("Verifying...");
      const membershipVerifier = new MembershipVerifier({
        ...defaultAddressMembershipVConfig,
        enableProfiler: true
      });
      await membershipVerifier.initWasm();

      console.time("Verification time");
      const isSuccess = await membershipVerifier.verify(zkProof, publicInput.serialize());
      console.timeEnd("Verification time");

      if (isSuccess) {
        console.log("Successfully verified proof!");
      } else {
        console.log("Failed to verify proof :(");
      }
  };

  return (
    <div class="bg-gray-100">
    <header class="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white py-20">
        <div class="container mx-auto px-4">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">ZKPfightAI</h1>
            <p class="text-2xl">A secure and efficient way to differentiate between authentic human-created digital content and AI-generated fakes.</p>
        </div>
    </header>
    <section class="container mx-auto px-4 py-6">
        <h2 class="text-3xl font-bold mb-6">What is ZKECDSA?</h2>
        <p>
          Spartan-ECDSA (Zero-Knowledge ECDSA) is a cryptographic protocol that allows a prover to demonstrate the knowledge of a private key or ETH address without revealing any information about that key ot address itself.
          ECDSA is used in Ethereum and Bitcoin. <b> Spartan-ECDSA is the fastest open-source method to verify secp256k1 ECDSA signatures in zero-knowledge. </b>
          It can be used in hardware devices such as microphones and cameras to prevent misinformation. Or it can be used in a consumer app like this.
          This app allows you to create ZK-badges for your content proving that they are human-created.
        </p>
    </section>
    <section class="container mx-auto px-4 py-6">
      <h2 class="text-3xl font-bold mb-8">Steps to Create and Verify Proof</h2>
      <div class="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-xl font-bold mb-4">Step 1</h3>
          <p>Paste the URL to the asset, such as a podcast or image, into the form below.</p>
        </div>
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-xl font-bold mb-4">Step 2</h3>
          <p>Create a name and description for your asset.</p>
        </div>
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-xl font-bold mb-4">Step 3</h3>
          <p>Press the "Create Proof" button to generate a cryptographic proof.</p>
        </div>
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-xl font-bold mb-4">Step 4</h3>
          <p>Add the URL to the proof under your asset on the podcast or image page.</p>
        </div>
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-xl font-bold mb-4">Step 5</h3>
          <p>Now anyone can verify your proof in their browser, ensuring the authenticity and integrity of your asset.</p>
        </div>
      </div>
    </section>

    <section class="container mx-auto px-4 py-8 bg-white shadow rounded-lg">
      <h2 class="text-3xl font-bold mb-6">Create a Proof Using ETH Address <span class="text-lg font-bold mb-6">({proverAddressString})</span></h2>
          <div class="mb-6">
              <label class="block mb-2">URL of verified asset</label>
              <input type="text" class="w-full p-2 border border-gray-300 rounded" placeholder="Enter URL" />
          </div>
          <div class="mb-6">
              <label class="block mb-2">Name of proof</label>
              <input type="text" class="w-full p-2 border border-gray-300 rounded" placeholder="Enter Name" />
          </div>
          <div class="mb-6">
              <label class="block mb-2">Description</label>
              <textarea class="w-full p-2 border border-gray-300 rounded" rows="4" placeholder="Enter Description"></textarea>
          </div>
          <button onClick={proverAddressMembership} class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Create Proof</button>
    </section>
    <section class="container mx-auto px-4 py-16">
        <h2 class="text-3xl font-bold mb-6">Proofs</h2>
        <table class="w-full bg-white shadow rounded-lg">
            <thead class="bg-gray-200">
                <tr>
                  <th class="px-4 py-2">URL</th>
                  <th class="px-4 py-2">Name</th>
                  <th class="px-4 py-2">Description</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    </section>
    </div>
  );
}
