import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { VotingContext } from '../../context/Voter';
import Input from '../Input';

const AdminForm = () => {
    const { currentAccount, uploadJSONToIPFS, checkOnboardStatus } = useContext(VotingContext);
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [adminData, setAdminData] = useState({
        name: "",
        age: "",
        position: "",
        email: ""
    });

    const handleAdminSubmit = async () => {
        setLoading(true);
        setErrorMsg("");

        if (!adminData.name || !adminData.age || !adminData.position || !adminData.email) {
            setErrorMsg("Please fill in all admin details fields.");
            setLoading(false);
            return;
        }

        try {
            const masterPayload = {
                walletAddress: currentAccount,
                role: "Admin",
                personalDetails: {
                    name: adminData.name,
                    age: adminData.age,
                    position: adminData.position,
                    email: adminData.email,
                },
                timestamp: Date.now()
            };

            const masterIpfsUrl = await uploadJSONToIPFS(masterPayload);
            if (!masterIpfsUrl) {
                throw new Error("Failed to secure profile data to IPFS.");
            }

            const apiPayload = {
                address: currentAccount,
                role: "Admin",
                cid: masterIpfsUrl
            };

            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to save admin details.");
            }

            await checkOnboardStatus(currentAccount);
            router.push('/');
        } catch (error) {
            console.error("Submission Error:", error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="mb-8 border-b border-gray-800 pb-6 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Admin Initialization</h1>
                <p className="text-gray-400">Set up your Organizer Profile before creating an election.</p>
            </div>
            
            {!currentAccount ? (
                <div className="w-full text-center py-10 flex flex-col items-center">
                    <div className="text-red-500 mb-6">
                        <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-white">Wallet Not Connected</h2>
                    <p className="text-gray-400 text-sm max-w-sm mb-4">
                        Please connect your MetaMask wallet first to register as an Election Admin.
                    </p>
                </div>
            ) : (
                <div className="animate-fade-in space-y-4">
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
                            {errorMsg}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input title="Full Name" placeholder="Jane Doe" inputType="text" value={adminData.name} handleClick={(e) => setAdminData({...adminData, name: e.target.value})} />
                        <Input title="Age" placeholder="35" inputType="number" value={adminData.age} handleClick={(e) => setAdminData({...adminData, age: e.target.value})} />
                        <Input title="Position" placeholder="Chief Electoral Officer" inputType="text" value={adminData.position} handleClick={(e) => setAdminData({...adminData, position: e.target.value})} />
                        <Input title="Email Address" placeholder="admin@election.org" inputType="email" value={adminData.email} handleClick={(e) => setAdminData({...adminData, email: e.target.value})} />
                    </div>
                    
                    <div className="w-full mt-4 bg-gray-900 border border-primary/20 p-4 rounded-xl">
                        <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Verified Contract Address</p>
                        <input 
                            type="text" 
                            disabled
                            className="w-full bg-black border border-gray-800 p-3 rounded-lg text-gray-400 font-mono text-sm opacity-80"
                            value={currentAccount || 'Not Connected'} 
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-800 mt-8">
                        <button 
                            onClick={handleAdminSubmit}
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center ${loading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/80 hover:shadow-primary/50'}`}
                        >
                            {loading ? "Initializing..." : "Complete Setup & Proceed to Dashboard"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminForm;
