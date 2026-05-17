import React, { useState, useContext } from 'react';
import { VotingContext } from '../context/Voter';
import VoterForm from '../components/Onboarding/VoterForm';
import CandidateForm from '../components/Onboarding/CandidateForm';
import AdminForm from '../components/Onboarding/AdminForm';

const Onboarding = () => {
    const { currentAccount } = useContext(VotingContext);
    const [activeTab, setActiveTab] = useState("Voter");

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 pt-24">
            <div className="bg-paper p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-3xl relative overflow-hidden">
                
                {/* MetaMask Mobile Warning */}
                {(!currentAccount && typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) && (
                    <div className="bg-yellow-900/40 border border-yellow-500/50 text-yellow-200 p-4 rounded-xl mb-6 text-sm flex gap-3">
                        <svg className="w-6 h-6 shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <strong className="block mb-1">Mobile Users Alert</strong>
                            Please manually open this link inside the <strong>MetaMask Application Browser</strong>. Web3 connections will not work in standard Safari or Chrome.
                        </div>
                    </div>
                )}

                {/* Role Tabs */}
                <div className="flex w-full mt-2 mb-8 bg-black/40 rounded-xl p-1 border border-gray-800 relative z-10">
                    {["Voter", "Candidate", "Admin"].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "Voter" && <VoterForm activeTab={activeTab} />}
                {activeTab === "Candidate" && <CandidateForm activeTab={activeTab} />}
                {activeTab === "Admin" && <AdminForm />}

            </div>
        </div>
    );
};

export default Onboarding;
