
import React, { useState, useEffect, useContext } from 'react';

// INTERNAL IMPORT
import { VotingContext } from '../context/Voter';
import Card from '../components/Card';

const VoterList = () => {
  const { getAllVoterData, voterArray, checkIfWalletIsConnected } = useContext(VotingContext);

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllVoterData();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-7xl mx-auto pt-10">
        <h1 className="text-4xl font-bold text-white mb-2">Registered Voters</h1>
        <p className="text-gray-400 mb-10">List of all authorized voters in the system.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {voterArray.map((el, i) => (
            <Card
              key={i}
              image={el.image}
              name={el.name}
              id={el.id}
              address={el.address}
              voteCount={undefined} // Voters don't display vote counts on themselves
              votedStatus={el.voted}
              hideVoteButton={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoterList;