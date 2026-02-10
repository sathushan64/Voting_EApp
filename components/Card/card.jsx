
import React from "react";
import Image from "next/image";

const Card = ({ image, name, id, address, voteCount, giveVote, hideVoteButton }) => {
    return (
        <div className="bg-paper p-6 rounded-2xl border border-gray-800 hover:border-primary transition-all duration-300 group hover:shadow-2xl hover:shadow-primary/20 relative overflow-hidden">
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-gray-900">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        layout="fill"
                        objectFit="cover"
                        className="group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                        No Image
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white">
                    ID: #{id}
                </div>
            </div>

            <h2 className="text-xl font-bold mb-1 truncate">{name}</h2>
            <p className="text-gray-400 text-xs mb-4 font-mono truncate">{address}</p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase">Total Votes</span>
                    <span className="text-2xl font-bold text-accent">{voteCount !== undefined ? voteCount : '-'}</span>
                </div>

                {!hideVoteButton && (
                    <button
                        onClick={() => giveVote({ id, address })}
                        className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-primary/50 transition-all"
                    >
                        Vote
                    </button>
                )}
            </div>
        </div>
    );
};

export default Card;
