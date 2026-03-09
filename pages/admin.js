import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';

// INTERNAL IMPORT
import { VotingContext } from '../context/Voter';
import Button from '../components/Button';
import Input from '../components/Input';

const AdminDashboard = () => {
    const [newAdminAddress, setNewAdminAddress] = useState('');
    const { currentAccount, votingOrganizer, transferAdminRights } = useContext(VotingContext);
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="bg-paper p-10 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-4xl flex flex-col items-center justify-center">

                {currentAccount && votingOrganizer && currentAccount.toLowerCase() !== votingOrganizer.toLowerCase() ? (
                    <div className="w-full text-center py-20 flex flex-col items-center">
                        <div className="text-red-500 mb-6">
                            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h1 className="text-4xl font-bold mb-4 text-white">Access Denied</h1>
                        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-8">
                            This is the Admin Settings Dashboard. Only the designated Election Organizer is authorized to access this page.
                        </p>
                        <Button btnName="Return Home" handleClick={() => router.push('/')} />
                    </div>
                ) : (
                    <div className="w-full max-w-2xl text-center">
                        <div className="mb-6 inline-block p-4 rounded-full bg-primary/10 border border-primary/20">
                            <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        
                        <h1 className="text-4xl font-bold mb-2 text-white">Admin Settings</h1>
                        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                            You are the current Election Organizer. From this dashboard, you can transfer your administrative rights to a different wallet address.
                        </p>

                        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 mb-8 text-left">
                            <h3 className="text-lg font-semibold text-white mb-2">Current Admin</h3>
                            <p className="text-primary break-all font-mono text-sm bg-black/40 p-3 rounded-lg border border-primary/20">
                                {votingOrganizer || "Loading..."}
                            </p>
                        </div>

                        <div className="text-left mb-8">
                            <Input
                                inputType="text"
                                title="Transfer Admin Rights to New Address"
                                placeholder="0x..."
                                handleClick={(e) => setNewAdminAddress(e.target.value)}
                            />
                        </div>

                        <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-2xl mb-8">
                            <p className="text-red-400 text-sm flex items-start gap-3 text-left">
                                <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span><strong>Warning:</strong> Transferring admin rights is an irreversible action. Once you transfer the rights, you will immediately lose access to this dashboard and the Candidate Registration page unless the new admin transfers it back to you.</span>
                            </p>
                        </div>

                        <Button
                            btnName="Transfer Rights (Irreversible)"
                            handleClick={() => transferAdminRights(newAdminAddress)}
                            classStyles="w-full bg-red-600 hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] text-white"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
