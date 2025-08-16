import React, { useState } from 'react';
import type { Room, DominoVariant } from './types';

type Database = any;

interface JoinWithCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (room: Room) => void;
  database: Database;
  variant: DominoVariant;
}

const JoinWithCodeModal: React.FC<JoinWithCodeModalProps> = ({ isOpen, onClose, onJoinRoom, database, variant }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isJoining) return;

    setIsJoining(true);
    setError('');

    const uppercaseCode = code.trim().toUpperCase();

    try {
      const roomsRef = database.ref('rooms');
      const query = roomsRef.orderByChild('accessCode').equalTo(uppercaseCode);
      const snapshot = await query.once('value');
      
      if (snapshot.exists()) {
        const roomsData = snapshot.val();
        let foundRoom: Room | null = null;
        let foundRoomId: string | null = null;

        // Find the room that also matches the current game variant
        for (const roomId in roomsData) {
          if (roomsData[roomId].variant === variant) {
            foundRoom = roomsData[roomId];
            foundRoomId = roomId;
            break;
          }
        }

        if (foundRoom && foundRoomId) {
          onJoinRoom({ ...foundRoom, id: foundRoomId });
        } else {
          setError('Invalid code for this game mode.');
        }
      } else {
        setError('Invalid room code.');
      }
    } catch (err) {
      console.error("Error joining with code:", err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-800 border-2 border-amber-500/50 rounded-lg shadow-2xl shadow-amber-500/10 w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-amber-500/20 flex justify-between items-center flex-shrink-0">
          <h3 className="font-display text-2xl text-amber-300">Join Private Room</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white disabled:text-gray-600" disabled={isJoining}>&times;</button>
        </div>
        <form onSubmit={handleJoin} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="room-code" className="block font-bold text-sm text-gray-300 mb-2">
              Enter Access Code for <span className="capitalize text-amber-300">{variant}</span>
            </label>
            <input
              type="text"
              id="room-code"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none font-mono text-2xl tracking-widest text-center"
              placeholder="ABC123"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          <div className="flex justify-end space-x-4 pt-2">
            <button type="button" onClick={onClose} className="font-display bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50" disabled={isJoining}>
              Cancel
            </button>
            <button type="submit" className="font-display bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-green-800 disabled:cursor-wait" disabled={isJoining || !code.trim()}>
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinWithCodeModal;