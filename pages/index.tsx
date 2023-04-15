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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState('');

  //form inputs
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [items, setItems] = useState([]);

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
                alert('Open Metamask extension or refresh');
                console.error("User denied account access");
              }
          } else {
              alert('Open Metamask extension or refresh');
              console.log("MetaMask is not installed");
          }
      }

      getProverAddress();
  }, []);

  const publicKeyMembershipProof = async () => {
      const message = Buffer.from("I am human");
      const messageHash = hashPersonalMessage(message);
      setIsLoading(true)

      const { v, r, s } = ecsign(messageHash, privateKey);
      const recoveredPubKey = ecrecover(messageHash, v, r, s);
      const signature = `0x${r.toString("hex")}${s.toString("hex")}${v.toString(16)}`;

      const hasher = new Poseidon();
      await hasher.initWasm();

      const depth = 20;
      const publicKeyTree = new Tree(depth, hasher);

      const publicKeyHash = hasher.hashPubKey(recoveredPubKey);

      publicKeyTree.insert(publicKeyHash);

      for (const member of ["🐻", "🐶", "🐼"]) {
        const key = privateToPublic(
          Buffer.from("".padStart(16, member), "utf16le")
        );
        publicKeyTree.insert(hasher.hashPubKey(key));
      }

      const idx = publicKeyTree.indexOf(publicKeyHash);
      const proof = publicKeyTree.createProof(idx);
      setIsLoadingMessage("Proving...")

      console.log("Proving...");
      console.time("Full proving time");

      const membershipProver = new MembershipProver({
        ...defaultPubkeyMembershipPConfig,
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

      const newItem = {
        url,
        name,
        description,
        zkProof,
        publicInput,
        type: 'key'
      };

      // Would like to save these on-chain or elsewhere so they are universally avaiable.
      setItems([...items, newItem]);

      setIsLoading(false)
      setIsLoadingMessage('')
      setUrl('')
      setName('')
      setDescription('')
  }

  const proveAddressMembership = async () => {

      const message = Buffer.from("I am human");
      const messageHash = hashPersonalMessage(message);

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: ["I am human", proverAddressString],
      });

      setIsLoading(true)
      console.log("Sign ok...")
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
      console.log("Tree ok..")

      const idx = addressTree.indexOf(BigInt(proverAddressString));
      const proof = addressTree.createProof(idx);

      setIsLoadingMessage("Proving...")
      console.log("Proving...")

      const membershipProver = new MembershipProver({
        ...defaultAddressMembershipPConfig,
        enableProfiler: true
      });

      await membershipProver.initWasm();
      console.log("wasm init done..")

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

      const newItem = {
        url,
        name,
        description,
        zkProof,
        publicInput,
        type: 'address'
      };

      // Would like to save these on-chain or elsewhere so they are universally avaiable.
      setItems([...items, newItem]);

      setIsLoading(false)
      setIsLoadingMessage('')
      setUrl('')
      setName('')
      setDescription('')

      return;
  };

  const verifyAddressMembership = async (zkProof, publicInput, type) => {
      console.log(zkProof.length)
      if (!zkProof || !publicInput) {
        return;
      }
      console.log("Verifying...");
      setIsLoading(true)
      setIsLoadingMessage("Verifying...")

      if (type === 'address') {
        const membershipVerifier = new MembershipVerifier({
          ...defaultAddressMembershipVConfig,
          enableProfiler: true
        });
        await membershipVerifier.initWasm();

        console.time("Verification time");
        const isSuccess = await membershipVerifier.verify(zkProof, publicInput.serialize());
        console.timeEnd("Verification time");

        if (isSuccess) {
            alert("Successfully verified proof!");
        } else {
            alert("Failed to verify proof :(");
        }
      } else {
        const membershipVerifier = new MembershipVerifier({
          ...defaultPubkeyMembershipVConfig,
          enableProfiler: true
        });
        await membershipVerifier.initWasm();

        console.time("Verification time");
        const isSuccess = await membershipVerifier.verify(zkProof, publicInput.serialize());
        console.timeEnd("Verification time");

        if (isSuccess) {
          alert("Successfully verified proof!");
        } else {
          alert("Failed to verify proof :(");
        }
      }

      setIsLoading(false)
      setIsLoadingMessage('')
  };

  return (
    <div className="bg-gray-100">
    <header className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">ZKPfightAI</h1>
            <p className="text-2xl">A secure and efficient way to differentiate between authentic human-created digital content from AI-generated fakes.
            Using Metamask, ETH and zero-knowledge proofs.</p>
        </div>
    </header>
    <section className="container mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold mb-6">What is ZKECDSA?</h2>
        <p>
          Spartan-ECDSA (Zero-Knowledge ECDSA) is a cryptographic protocol that allows a prover to demonstrate the knowledge of a private key or ETH address without revealing any information about that key ot address itself.
          ECDSA is used in Ethereum and Bitcoin. <b> Spartan-ECDSA is the fastest open-source method to verify secp256k1 ECDSA signatures in zero-knowledge. </b>
          It can be used in hardware devices such as microphones and cameras to prevent misinformation. Or it can be used in a consumer app like this.
          This app allows you to create ZK-badges for your content proving that they are human-created.
        </p>
    </section>
    <section className="container mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold mb-8">Steps to Create and Verify Proof</h2>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Step 1</h3>
          <p>Connect to your wallet. This will be used for signing</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Step 2</h3>
          <p>Paste the URL to the asset, such as a podcast or image, into the form below. Create a name and description for your asset.</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Step 3</h3>
          <p>Press the "Create Proof" button to generate a cryptographic proof.</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Step 4</h3>
          <p>Add the URL to the proof under your asset on the podcast or image page.</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Step 5</h3>
          <p>Now anyone can verify your proof in their browser, ensuring the authenticity and integrity of your asset.</p>
        </div>
      </div>
    </section>

    <section className="container mx-auto px-4 py-8 bg-white shadow rounded-lg">
      <h2 className="text-3xl font-bold mb-6">Create a Proof <span className="text-lg font-bold mb-6">({proverAddressString})</span></h2>
          <div className="mb-6">
              <label className="block mb-2">URL of asset that you want to verify</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter URL"
              />
          </div>
          <div className="mb-6">
              <label className="block mb-2">Name of proof</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter Name"
              />
          </div>
          <div className="mb-6">
              <label className="block mb-2">Description</label>
              <textarea
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="w-full p-2 border border-gray-300 rounded"
               rows="4"
               placeholder="Enter Description"
             ></textarea>
          </div>
          <button onClick={proveAddressMembership} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Create Proof ETH Address"
            )}
            {isLoadingMessage}
          </button>
          <button onClick={publicKeyMembershipProof} className="bg-blue-600 text-white px-4 py-2 ml-2 rounded hover:bg-blue-700">
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Create Proof Private Key"
            )}
            {isLoadingMessage}
          </button>
          <p className="text-md mt-2">*In demo mode use the private key version first. It is fast!</p>
          <p className="text-md mt-2">*Depending on your machine ETH address may take up to 60s~ for proving.</p>
    </section>
    <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-6">Proofs</h2>
        <table className="w-full bg-white shadow rounded-lg">
            <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2">URL</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Verify</th>
                </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{item.url}</td>
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.description}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => verifyAddressMembership(item.zkProof, item.publicInput, item.type)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      {isLoading ? (
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        "Verify Proof"
                      )}
                      {isLoadingMessage}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tbody>
            </tbody>
        </table>
    </section>
    </div>
  );
}
