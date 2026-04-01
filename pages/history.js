import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { VotingContext } from '../context/Voter';

const History = () => {
    const { currentAccount, votingOrganizer } = useContext(VotingContext);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("Voters");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);

    // --- SECURE ROUTE GUARD ---
    useEffect(() => {
        if (!currentAccount || !votingOrganizer) return;
        if (currentAccount.toLowerCase() !== votingOrganizer.toLowerCase()) {
            router.push('/');
        }
    }, [currentAccount, votingOrganizer]);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchDecentralizedUsers = async () => {
            try {
                // 1. Get raw mapping 
                const res = await axios.get('/api/user');
                const rawUsers = res.data.users || [];

                // 2. Resolve every IPFS CID heavily mapped in the payload
                const resolvedUsers = await Promise.all(rawUsers.map(async (u) => {
                    if (u.cid) {
                        try {
                            const ipfsData = await axios.get(u.cid);
                            return {
                                ...u,
                                profile: ipfsData.data
                            };
                        } catch (err) {
                            console.error(`Failed to resolve IPFS for ${u.address}:`, err);
                            return u; // Return without resolved profile if failed
                        }
                    }
                    return u; // Legacy format or missing cid
                }));

                setUsers(resolvedUsers);
            } catch (err) {
                console.error("Error fetching user history:", err);
                setErrorMsg("Failed to synchronize with IPFS History mapping.");
            } finally {
                setLoading(false);
            }
        };

        if (currentAccount && currentAccount.toLowerCase() === votingOrganizer.toLowerCase()) {
            fetchDecentralizedUsers();
        }
    }, [currentAccount, votingOrganizer]);

    // Derived States
    const parsedVoters = users.filter(u => u.role === "Voter");
    const parsedCandidates = users.filter(u => u.role === "Candidate");
    const displayedList = activeTab === "Voters" ? parsedVoters : parsedCandidates;

    // --- COMPONENTS ---
    const UserCard = ({ user }) => {
        const profile = user.profile;
        if (!profile) return (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <p className="text-gray-400">Legacy or Corrupted CID Profile</p>
                <p className="text-xs font-mono text-gray-500 mt-2">{user.address}</p>
            </div>
        );

        return (
            <div className="bg-gray-900 border border-gray-700 hover:border-primary transition-all p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                {/* Visuals column */}
                <div className="flex flex-col gap-4 min-w-[150px] shrink-0">
                    <img 
                        src={profile.verification?.selfie || 'https://via.placeholder.com/150'} 
                        alt="Selfie" 
                        className="w-32 h-32 object-cover rounded-full border-4 border-gray-800 self-center"
                    />
                    <div className="flex gap-2 justify-center">
                        <img 
                            src={profile.verification?.nicFront || 'https://via.placeholder.com/50'} 
                            alt="NIC Front" 
                            onClick={() => setSelectedImage(profile.verification?.nicFront)}
                            className="w-14 h-10 object-cover rounded shadow border border-gray-700 hover:scale-110 transition-transform cursor-pointer"
                        />
                        <img 
                            src={profile.verification?.nicBack || 'https://via.placeholder.com/50'} 
                            alt="NIC Back" 
                            onClick={() => setSelectedImage(profile.verification?.nicBack)}
                            className="w-14 h-10 object-cover rounded shadow border border-gray-700 hover:scale-110 transition-transform cursor-pointer"
                        />
                    </div>
                </div>

                {/* Details Column */}
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white capitalize">{profile.personalDetails?.name}</h2>
                            <p className="text-primary text-sm font-semibold">{user.role} • {profile.personalDetails?.gender}</p>
                        </div>
                        <span className="bg-gray-800 px-3 py-1 rounded-full text-xs font-mono text-gray-400">
                            {user.address.slice(0, 6)}...{user.address.slice(-4)}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-gray-300 mt-2">
                        <p><span className="font-semibold text-gray-500">DOB:</span> {profile.personalDetails?.dob}</p>
                        <p><span className="font-semibold text-gray-500">NIC:</span> {profile.personalDetails?.nic}</p>
                        <p><span className="font-semibold text-gray-500">Phone:</span> {profile.personalDetails?.phone}</p>
                        <p className="break-all"><span className="font-semibold text-gray-500">Email:</span> {profile.personalDetails?.email}</p>
                        <p className="break-words mt-1"><span className="font-semibold text-gray-500">Address:</span> {profile.personalDetails?.address}</p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-800 hidden md:block">
                        <p className="text-xs font-mono text-gray-500 truncate w-full" title={user.cid}>
                            IPFS: {user.cid}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-20 px-4 md:px-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white">Decentralized Directory</h1>
                        <p className="text-gray-400 mt-2">Admin exclusive view of resolved IPFS identity footprints.</p>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                        {errorMsg}
                    </div>
                )}

                {/* Tab Controls */}
                <div className="flex gap-4 mb-8 border-b border-gray-800">
                    {["Voters", "Candidates"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-4 text-lg font-bold transition-all ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab === "Voters" ? "Registered Voters" : "Nominated Candidates"} 
                            <span className="ml-2 bg-gray-800 text-xs px-2 py-1 rounded-full">
                                {tab === "Voters" ? parsedVoters.length : parsedCandidates.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-primary">
                        <svg className="w-12 h-12 animate-spin mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="font-bold tracking-widest uppercase">Resolving IPFS Hashes...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 animate-fade-in">
                        {displayedList.length === 0 ? (
                            <div className="col-span-full py-16 text-center bg-gray-900 rounded-2xl border border-gray-800">
                                <span className="text-4xl">🗂️</span>
                                <h3 className="text-xl font-bold text-gray-300 mt-4">No Data Found</h3>
                                <p className="text-gray-500">There are no {activeTab.toLowerCase()} currently resolved in the system.</p>
                            </div>
                        ) : (
                            displayedList.map((user, idx) => (
                                <UserCard key={user.address + idx} user={user} />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* LIGHTBOX MODAL */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-red-500 bg-gray-900 rounded-full p-2 text-xl font-bold cursor-pointer transition-colors shadow-lg border border-gray-700"
                        >
                            ✕
                        </button>
                        <img 
                            src={selectedImage} 
                            alt="Enlarged Document" 
                            className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
