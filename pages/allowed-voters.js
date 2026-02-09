
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

// INTERNAL IMPORT
import { VotingContext } from '../context/Voter';
import Button from '../components/Button';
import Input from '../components/Input';

const AllowedVoters = () => {
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, setFormInput] = useState({
        name: '',
        address: '',
        position: '',
    });

    const { uploadToIPFS, createVoter } = useContext(VotingContext);
    const router = useRouter();

    // DROPZONE
    const onDrop = useCallback(async (acceptedFile) => {
        const url = await uploadToIPFS(acceptedFile[0]);
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

                {/* IMAGE UPLOAD SECTION */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-6 text-white text-center">Voter Photo</h2>
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
                    <h1 className="text-4xl font-bold mb-2 text-white">Register Voter</h1>
                    <p className="text-gray-400 mb-8">Authorize a new voter to participate in the election.</p>

                    <Input
                        inputType="text"
                        title="Name"
                        placeholder="Voter Name"
                        handleClick={(e) => setFormInput({ ...formInput, name: e.target.value })}
                    />
                    <Input
                        inputType="text"
                        title="Address"
                        placeholder="Wallet Address"
                        handleClick={(e) => setFormInput({ ...formInput, address: e.target.value })}
                    />
                    <Input
                        inputType="text"
                        title="Position"
                        placeholder="Position / Role"
                        handleClick={(e) => setFormInput({ ...formInput, position: e.target.value })}
                    />

                    <div className="mt-8">
                        <Button
                            btnName="Authorize Voter"
                            handleClick={() => createVoter(formInput, fileUrl)}
                            classStyles="w-full"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AllowedVoters;
