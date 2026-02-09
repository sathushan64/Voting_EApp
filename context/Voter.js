import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { useRouter } from 'next/router';

// INTERNAL IMPORT
import { VotingAddress, VotingAddressABI } from './constants';

const fetchContract = (signerOrProvider) => {
    console.log("DEBUG: fetchContract using address:", VotingAddress);
    return new ethers.Contract(VotingAddress, VotingAddressABI, signerOrProvider);
};

export const VotingContext = React.createContext();

export const VotingProvider = ({ children }) => {
    const router = useRouter();
    const [currentAccount, setCurrentAccount] = useState('');
    const [candidateLength, setCandidateLength] = useState('');
    const [pushCandidate, setPushCandidate] = useState([]);
    const [candidateIndex, setCandidateIndex] = useState(null);
    const [candidateArray, setCandidateArray] = useState([]);

    const [error, setError] = useState('');
    const [voterArray, setVoterArray] = useState([]);
    const [voterLength, setVoterLength] = useState('');
    const [voterAddress, setVoterAddress] = useState([]);

    // CONNECTING METAMASK
    const checkIfWalletIsConnected = async () => {
        if (!window.ethereum) return setError('Please Install MetaMask');
        const account = await window.ethereum.request({ method: 'eth_accounts' });

        if (account.length) {
            setCurrentAccount(account[0]);
        } else {
            setError('Please Install MetaMask & Connect, Reload');
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            window.open("https://metamask.io/download/", "_blank");
            return setError('Please Install MetaMask');
        }
        setError('');

        try {
            const account = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            setCurrentAccount(account[0]);
            setError('');
        } catch (err) {
            console.log("Error connecting wallet:", err);
            if (err.code === 4001) {
                setError('User rejected the connection request.');
            } else {
                setError('Error connecting wallet. Please try again.');
            }
        }
    };

    // PINATA IPFS KEYS
    const pinataApiKey = '3c3a34c536225711a678';
    const pinataSecretApiKey = '598180b64a578024c85fa13b8b45dee67cfa9341efceb25ba336c44a4ef32ef4';

    // UPLOAD TO IPFS VOTE IMAGE
    const uploadToIPFS = async (file) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "multipart/form-data",
                },
            });
            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            return url;

        } catch (error) {
            console.log('Error uploading content to IPFS', error);
            setError(`Error uploading IPFS: ${error.message}`);
        }
    };

    // UPLOAD TO IPFS CANDIDATE IMAGE
    const uploadToIPFSCandidate = async (file) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "multipart/form-data",
                },
            });
            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            return url;
        } catch (error) {
            console.log('Error uploading content to IPFS', error);
            setError(`Error uploading IPFS: ${error.message}`);
        }
    };

    // CREATE VOTER
    const createVoter = async (formInput, fileUrl) => {
        const { name, address, position } = formInput;
        if (!name || !address || !position)
            return setError('Input data is missing');

        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);

        const data = JSON.stringify({ name, address, position, image: fileUrl });

        try {
            const res = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: data,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "application/json",
                },
            });

            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;

            const voter = await contract.voterRight(address.trim(), name, fileUrl, url);
            await voter.wait();

            router.push('/voterList');
        } catch (error) {
            setError(`Error creating voter: ${error.message}`);
        }
    };

    // GET VOTER DATA
    const getAllVoterData = async () => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);

            // VOTER LIST
            const voterListData = await contract.getVoterList();
            setVoterAddress(voterListData);

            const items = await Promise.all(
                voterListData.map(async (el) => {
                    const singleVoterData = await contract.getVoterData(el);
                    // 0: id, 1: name, 2: image, 3: address, 4: ipfs, 5: allowed, 6: voted
                    return {
                        id: singleVoterData[0].toNumber(),
                        name: singleVoterData[1],
                        image: singleVoterData[2],
                        address: singleVoterData[3],
                        ipfs: singleVoterData[4],
                        allowed: singleVoterData[5].toNumber(),
                        voted: singleVoterData[6],
                    };
                })
            );
            setVoterArray(items);
        } catch (error) {
            // console.log(error); // Quiet fail if not connected
        }
    };


    // GIVE VOTE
    const giveVote = async (id) => {
        try {
            const voterAddress = id.address;
            const voterId = id.id;
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);

            const voted = await contract.vote(voterAddress, voterId);
            await voted.wait();
            router.push('/voted');
        } catch (error) {
            console.log(error);
            setError('Error in voting');
        }
    };

    // CANDIDATE SECTION
    const setCandidate = async (candidateForm, fileUrl, router) => {
        const { name, address, age } = candidateForm;
        if (!name || !address || !age) return setError('Input data is missing');

        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);

        const data = JSON.stringify({ name, address, age, image: fileUrl });

        try {
            const res = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: data,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "application/json",
                },
            });

            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;

            const candidate = await contract.setCandidate(
                address.trim(),
                age,
                name,
                fileUrl,
                ipfsUrl
            );
            await candidate.wait();

            router.push('/');
        } catch (error) {
            setError(`Error creating candidate: ${error.message}`);
        }
    };

    const getNewCandidate = async () => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);

            const allCandidate = await contract.getCandidate();

            const allCandidateData = await Promise.all(
                allCandidate.map(async (el) => {
                    const singleCandidate = await contract.getCandidateData(el);
                    return {
                        age: singleCandidate[0],
                        name: singleCandidate[1],
                        candidateID: singleCandidate[2].toNumber(),
                        image: singleCandidate[3],
                        voteCount: singleCandidate[4].toNumber(),
                        ipfs: singleCandidate[5],
                        address: singleCandidate[6]
                    }
                })
            );
            setCandidateArray(allCandidateData);
            setCandidateLength(allCandidate.length);
        } catch (error) {
            // console.log(error);
        }
    };

    return (
        <VotingContext.Provider
            value={{
                currentAccount,
                connectWallet,
                uploadToIPFS,
                createVoter,
                voterArray,
                getAllVoterData,
                giveVote,
                setCandidate,
                getNewCandidate,
                candidateArray,
                checkIfWalletIsConnected,
                candidateLength,
                error,
                voterLength,
                voterAddress,
                uploadToIPFSCandidate,
            }}
        >
            {children}
        </VotingContext.Provider>
    );
};
