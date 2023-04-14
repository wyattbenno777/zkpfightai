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

import { useState } from "react";
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

  const proverAddressMembership = async () => {
      const privateKey = Buffer.from("".padStart(16, "🐱"), "utf16le");
      const message = Buffer.from("harry potter");
      const messageHash = hashPersonalMessage(message);

      const { v, r, s } = ecsign(messageHash, privateKey);
      const signature = `0x${r.toString("hex")}${s.toString("hex")}${v.toString(16)}`;

      const hasher = new Poseidon();
      await hasher.initWasm();

      const depth = 20;
      const addressTree = new Tree(depth, hasher);

      const proverAddress = BigInt(
        "0x" + privateToAddress(privateKey).toString("hex")
      );
      addressTree.insert(proverAddress);

      for (const member of ["🐻", "🐶", "🐼"]) {
        const key = privateToPublic(
          Buffer.from("".padStart(16, member), "utf16le")
        );
        const address = BigInt("0x" + pubToAddress(key).toString("hex"));
        addressTree.insert(address);
      }

      const idx = addressTree.indexOf(proverAddress);
      const proof = addressTree.createProof(idx);

      console.log("Proving...");
      console.time("Full proving time");

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
    <div>
    <button
      onClick={proverAddressMembership}
      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
    >
      Prove Address Membership
    </button>
    </div>
  );
}
