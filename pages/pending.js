import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { VotingContext } from '../context/Voter';

const Pending = () => {
    const { currentAccount, connectWallet } = useContext(VotingContext);
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 pt-24 font-sans text-center">
            <div className="bg-paper p-10 md:p-14 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-2xl relative overflow-hidden flex flex-col items-center animate-fade-in">
                
                {/* Pending Icon */}
                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="w-24 h-24 bg-yellow-900/30 border-2 border-yellow-500/50 rounded-full flex items-center justify-center relative z-10 mx-auto text-yellow-500 shadow-lg shadow-yellow-500/20">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                    Registration Pending
                </h1>
                
                <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-lg">
                    Please wait for Admin Approval. Your identity and documents are currently under review. Once the admin approves your registration, your profile will be authorized on the blockchain.
                </p>

                <div className="bg-gray-900/50 px-6 py-4 rounded-xl border border-gray-800 w-full max-w-md mb-8 shadow-inner">
                    <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-widest">Connected Wallet</p>
                    <p className="font-mono text-primary font-bold text-lg">
                        {currentAccount ? `${currentAccount.slice(0, 8)}...${currentAccount.slice(-6)}` : 'Not Connected'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 rounded-full bg-gray-800 text-white font-bold hover:bg-gray-700 border border-gray-700 transition-all shadow-md"
                    >
                        Check Status
                    </button>
                    {!currentAccount && (
                        <button 
                            onClick={() => connectWallet()}
                            className="px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/80 transition-all shadow-lg shadow-primary/30"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>

                <div className="mt-8 text-sm text-gray-500">
                    If you believe this is an error, please contact the election organizer.
                </div>
            </div>
        </div>
    );
};

export default Pending;
