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
    const [votingOrganizer, setVotingOrganizer] = useState('');
    const [isOnboarded, setIsOnboarded] = useState(null);

    const [error, setError] = useState('');
    const [voterArray, setVoterArray] = useState([]);
    const [voterLength, setVoterLength] = useState('');
    const [voterAddress, setVoterAddress] = useState([]);

    useEffect(() => {
        const handleAccountsChanged = () => {
            // Reload the page to ensure all state and RouteGuards are cleanly reset for the new account
            window.location.reload();
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        if (typeof window !== "undefined" && window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, []);

    const checkOnboardStatus = async (account) => {
        try {
            // Check the actual smart contract first
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            const contract = fetchContract(provider);
            
            const voterData = await contract.voters(account);
            const candidateData = await contract.candidates(account);
            
            if (voterData._address !== ethers.constants.AddressZero || candidateData._address !== ethers.constants.AddressZero) {
                setIsOnboarded('approved');
                return;
            }

            // If not in smart contract, check pending registration list (off-chain API)
            const res = await axios.get(`/api/user?address=${account}`);
            if (res.data.onboarded) {
                setIsOnboarded('pending');
            } else {
                setIsOnboarded('unregistered');
            }
        } catch (error) {
            console.log("Error checking onboard status", error);
            setIsOnboarded('unregistered');
        }
    };

    // CONNECTING METAMASK
    const checkIfWalletIsConnected = async () => {
        if (!window.ethereum) return setError('Please Install MetaMask');
        const account = await window.ethereum.request({ method: 'eth_accounts' });

        if (account.length) {
            setCurrentAccount(account[0]);
            await checkOnboardStatus(account[0]);
            await getVotingOrganizer();
        } else {
            setError('Please Install MetaMask & Connect, Reload');
        }
    };

    const getVotingOrganizer = async () => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            const { chainId } = await provider.getNetwork();
            
            // Force switch to localhost if the user is on the wrong network (e.g., Mainnet Chain ID 1)
            if (chainId !== 31337) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x7A69' }], // 31337 in hex
                    });
                    // Refresh the page automatically after switching networks to remount provider correctly
                    window.location.reload();
                    return;
                } catch (switchError) {
                    console.error("Failed to switch network:", switchError);
                    setError("Please manually switch your MetaMask network to Localhost (8545).");
                    return;
                }
            }
            
            const contract = fetchContract(provider);
            const organizer = await contract.votingOrganizer();
            setVotingOrganizer(organizer.toLowerCase());
        } catch (error) {
            console.log("Error fetching organizer", error);
            const mmChainId = window.ethereum ? window.ethereum.networkVersion : 'none';
            setError(`Error fetching Organizer: ${error.message} \n(MetaMask is on Chain ID: ${mmChainId}, but Contract expects 31337)`);
        }
    };

    const transferAdminRights = async (newAddress) => {
        if (!newAddress) return setError("Please provide a new address");
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);

            const tx = await contract.changeOrganizer(newAddress);
            await tx.wait();
            
            // Re-fetch organizer state to instantly lock out the old admin
            await getVotingOrganizer();
            router.push('/'); 
        } catch (error) {
            console.log("Error transferring admin rights:", error);
            setError(`Error transferring rights: ${error.message}`);
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
            await checkOnboardStatus(account[0]);
            await getVotingOrganizer();
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

    const switchAccount = async () => {
        try {
            if (window.ethereum) {
                await window.ethereum.request({
                    method: "wallet_requestPermissions",
                    params: [{ eth_accounts: {} }]
                });
            }
        } catch (error) {
            console.log("Error switching account:", error);
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

    // UPLOAD JSON DATA TO IPFS
    const uploadJSONToIPFS = async (jsonData) => {
        if (!jsonData) return;
        try {
            const res = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: jsonData,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    "Content-Type": "application/json",
                },
            });
            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            return url;
        } catch (error) {
            console.log("Error Uploading JSON data to IPFS:", error);
            setError(`Error pinning JSON: ${error.message}`);
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
            setVoterLength(voterListData.length);

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
            console.log(error); // Quiet fail if not connected
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
                votingOrganizer,
                transferAdminRights,
                isOnboarded,
                checkOnboardStatus,
                uploadJSONToIPFS
            }}
        >
            {children}
        </VotingContext.Provider>
    );
};
