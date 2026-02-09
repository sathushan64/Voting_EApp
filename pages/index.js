
import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';

// INTERNAL IMPORT
import { VotingContext } from '../context/Voter';
import Card from '../components/Card';
import Loader from '../components/Loader'; // Will create this next

const index = () => {
    const {
        getNewCandidate,
        candidateArray,
        giveVote,
        checkIfWalletIsConnected,
        candidateLength,
        voterLength,
        currentAccount
    } = useContext(VotingContext);

    useEffect(() => {
        checkIfWalletIsConnected();
        getNewCandidate();
    }, []);

    return (
        <div className="min-h-screen bg-background p-8 font-sans">

            {/* HEADER SECTION */}
            <div className="flex flex-col items-center justify-center mb-16 pt-10 text-center">
                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-x">
                    Electronic Voting
                </h1>
                <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
                    Welcome to the future of governance. Experience secure, transparent, and tamper-proof voting with next-generation digital technology. Cast your vote with confidence and make your voice count.
                </p>

                <div className="mt-8 flex gap-4 text-sm font-mono text-gray-500">
                    <div className="px-4 py-2 bg-paper rounded border border-gray-800">
                        Candidates: <span className="text-white font-bold">{candidateLength}</span>
                    </div>
                    <div className="px-4 py-2 bg-paper rounded border border-gray-800">
                        Voters: <span className="text-white font-bold">{voterLength}</span>
                    </div>
                </div>
            </div>

            {/* WINNER SECTION */}
            {candidateArray.length > 0 && candidateArray.some(el => Number(el.voteCount) > 0) && (
                <div className="max-w-7xl mx-auto mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                            Current Leading Candidate
                        </h2>
                        <div className="h-1 flex-1 bg-gray-800 ml-6 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                        {candidateArray
                            .filter(c => Number(c.voteCount) === Math.max(...candidateArray.map(o => Number(o.voteCount))))
                            .map((el, i) => (
                                <div key={i} className="relative transform hover:scale-105 transition-all duration-300">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-2xl blur opacity-75 animate-pulse"></div>
                                    <div className="relative bg-black rounded-2xl p-6 border border-yellow-500/50">
                                        <div className="absolute top-0 right-0 p-4">
                                            <span className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                                                🏆 LEADER
                                            </span>
                                        </div>

                                        <div className="w-full h-64 rounded-xl overflow-hidden mb-6 border-2 border-yellow-500/20">
                                            <img
                                                src={el.image}
                                                alt={el.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-2">{el.name}</h3>
                                        <p className="text-gray-400 mb-4 text-sm font-mono truncate">{el.address}</p>

                                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                                            <span className="text-gray-400">Total Votes</span>
                                            <span className="text-3xl font-bold text-yellow-500">{el.voteCount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* CANDIDATE GRID */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white">All Candidates</h2>
                    <div className="h-1 flex-1 bg-gray-800 ml-6 rounded-full"></div>
                </div>

                {candidateArray.length === 0 ? (
                    <div className="text-center py-20 bg-paper rounded-2xl border border-gray-800 border-dashed">
                        <p className="text-gray-400 text-xl">No candidates registered yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {candidateArray.map((el, i) => (
                            <Card
                                key={i}
                                image={el.image}
                                name={el.name}
                                id={el.candidateID}
                                address={el.address}
                                voteCount={el.voteCount}
                                giveVote={giveVote}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default index;
