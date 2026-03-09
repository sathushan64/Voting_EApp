
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

// INTERNAL IMPORT
import { VotingContext } from '../context/Voter';
import Button from '../components/Button';
import Input from '../components/Input';

const CandidateRegistration = () => {
    const [fileUrl, setFileUrl] = useState(null);
    const [candidateForm, setCandidateForm] = useState({
        name: '',
        address: '',
        age: '',
    });

    const { uploadToIPFSCandidate, setCandidate, getNewCandidate, currentAccount, votingOrganizer } = useContext(VotingContext);
    const router = useRouter();

    // DROPZONE
    const onDrop = useCallback(async (acceptedFile) => {
        const url = await uploadToIPFSCandidate(acceptedFile[0]);
        setFileUrl(url);
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxSize: 5000000,
    });

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="bg-paper p-10 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-4xl flex flex-col md:flex-row gap-12">

                {currentAccount && votingOrganizer && currentAccount.toLowerCase() !== votingOrganizer.toLowerCase() ? (
                    <div className="w-full text-center py-20 flex flex-col items-center">
                        <div className="text-red-500 mb-6">
                            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h1 className="text-4xl font-bold mb-4 text-white">Access Denied</h1>
                        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-8">
                            This is the Candidate Registration Dashboard. Only the Election Organizer (Admin) is authorized to access this page and add new candidates to the blockchain.
                        </p>
                        <Button btnName="Return Home" handleClick={() => router.push('/')} />
                    </div>
                ) : (
                    <>
                        {/* IMAGE UPLOAD SECTION */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-6 text-white text-center">Candidate Photo</h2>
                    <div {...getRootProps()} className="w-full aspect-square bg-gray-900 rounded-2xl border-2 border-dashed border-gray-700 hover:border-primary transition-all flex items-center justify-center cursor-pointer relative overflow-hidden group">
                        <input {...getInputProps()} />
                        {fileUrl ? (
                            <img src={fileUrl} alt="Voter" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-6">
                                <p className="text-gray-400 mb-2 group-hover:text-primary transition-colors">Drag & Drop Image</p>
                                <p className="text-xs text-gray-600">or click to upload</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* DETAILS SECTION */}
                <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2 text-white">Register Candidate</h1>
                    <p className="text-gray-400 mb-8">Create a new candidate for the decentralized election.</p>

                    <Input
                        inputType="text"
                        title="Name"
                        placeholder="Candidate Name"
                        handleClick={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                    />
                    <Input
                        inputType="text"
                        title="Address"
                        placeholder="Wallet Address"
                        handleClick={(e) => setCandidateForm({ ...candidateForm, address: e.target.value })}
                    />
                    <Input
                        inputType="text"
                        title="Age"
                        placeholder="Candidate Age"
                        handleClick={(e) => setCandidateForm({ ...candidateForm, age: e.target.value })}
                    />

                    <div className="mt-8">
                        <Button
                            btnName="Authorize Candidate"
                            handleClick={() => setCandidate(candidateForm, fileUrl, router)}
                            classStyles="w-full"
                        />
                    </div>
                </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default CandidateRegistration;
