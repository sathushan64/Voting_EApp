
import React from 'react';
import Link from 'next/link';

const Voted = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-8">
                Vote Cast Successfully!
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mb-12">
                Your vote has been recorded on the Ethereum blockchain. Thank you for participating in this decentralized election.
            </p>
            <Link href="/" className="px-8 py-4 rounded-full bg-primary text-white font-bold text-lg hover:shadow-2xl transition-all">
                Back to Home
            </Link>
        </div>
    )
}

export default Voted;
