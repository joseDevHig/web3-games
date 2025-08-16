
import React, { useState } from 'react';
import type { Room, DominoVariant, RoomMode } from './types';
import { BnbIcon } from '../../icons/BnbIcon';
import { UsdtIcon } from '../../icons/UsdtIcon';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (roomDetails: Omit<Room, 'id'>) => Promise<void>;
  variant: DominoVariant;
  defaultScore: number;
  nativeCurrencySymbol: string;
  createdBy?: string;
}

const RoomModeButton: React.FC<{
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, description, isActive, onClick }) => (
    <button type="button" onClick={onClick} className={`text-left flex-1 p-3 rounded-md border-2 transition-colors ${isActive ? 'bg-amber-500/20 border-amber-500 text-white' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}>
        <span className="font-bold">{label}</span>
        <p className="text-xs font-normal">{description}</p>
    </button>
);


const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate, variant, defaultScore, nativeCurrencySymbol, createdBy }) => {
  const [name, setName] = useState('');
  const [betAmount, setBetAmount] = useState('0.01');
  const [currency, setCurrency] = useState<'native' | 'USDT'>('USDT');
  const [scoreToWin, setScoreToWin] = useState(defaultScore.toString());
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [mode, setMode] = useState<RoomMode>('2v2');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{ name: string; code: string } | null>(null);

  const handleCopyToClipboard = () => {
    if (createdRoomInfo) {
      navigator.clipboard.writeText(createdRoomInfo.code);
      alert('Code copied to clipboard!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Room name is required.');
      return;
    }
    if (name.length > 20) {
      setError('Room name must be 20 characters or less.');
      return;
    }
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Bet amount must be a positive number.');
      return;
    }
    
    const score = parseInt(scoreToWin, 10);
     if (isNaN(score) || score < 50 || score > 500) {
      setError('Winning score must be between 50 and 500.');
      return;
    }

    setIsCreating(true);

    const isPrivate = privacy === 'private';
    const accessCode =  Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const maxPlayers = mode === '1v1' ? 2 : 4;

    const roomDetails: Omit<Room, 'id'> = {
        name,
        type: 'cash',
        variant,
        scoreToWin: score,
        bet: { amount, currency },
        privacy,
        accessCode,
        mode,
        maxPlayers,
        createdBy: createdBy ?? 'user',
    };
    
    try {
      await onCreate(roomDetails);
      if (isPrivate) {
        setCreatedRoomInfo({ name, code: accessCode! });
      } else {
        onClose();
      }
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.log(err);
    } finally {
      setIsCreating(false);
    }
  };

  // if (createdRoomInfo) {
  //   return (
  //     <div 
  //       className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
  //       aria-modal="true"
  //       role="dialog"
  //     >
  //       <div className="bg-gray-800 border-2 border-green-500/50 rounded-lg shadow-2xl shadow-green-500/10 w-full max-w-md m-4 text-center p-8">
  //           <h3 className="font-display text-2xl text-green-300">Private Room Created!</h3>
  //           <p className="text-gray-300 mt-2">Your room <span className="font-bold text-white">{createdRoomInfo.name}</span> is ready.</p>
  //           <p className="text-gray-300 mt-4">Share this code with your friends:</p>

  //           <div className="my-4 p-4 bg-gray-900/70 border-2 border-dashed border-amber-400 rounded-lg">
  //               <p className="font-mono text-4xl tracking-widest text-amber-300">{createdRoomInfo.code}</p>
  //           </div>
            
  //           <div className="flex justify-center space-x-4">
  //                <button onClick={handleCopyToClipboard} className="font-display bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
  //                   Copy Code
  //               </button>
  //               <button onClick={onClose} className="font-display bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
  //                   Close
  //               </button>
  //           </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-800 border-2 border-amber-500/50 rounded-lg shadow-2xl shadow-amber-500/10 w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-amber-500/20 flex justify-between items-center flex-shrink-0">
          <h3 className="font-display text-2xl text-amber-300">Create New Room</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white disabled:text-gray-600" disabled={isCreating}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          <div>
            <label className="block font-bold text-sm text-gray-300 mb-2">Room Privacy</label>
             <div className="flex space-x-4">
                <button type="button" onClick={() => setPrivacy('public')} className={`flex-1 p-3 rounded-md font-bold border-2 transition-colors ${privacy === 'public' ? 'bg-green-500/20 border-green-500 text-white' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}>
                    Public
                </button>
                <button type="button" onClick={() => setPrivacy('private')} className={`flex-1 p-3 rounded-md font-bold border-2 transition-colors ${privacy === 'private' ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}>
                    Private
                </button>
            </div>
             <p className="text-xs text-gray-400 mt-2">{privacy === 'public' ? 'Your room will be visible to everyone in the lobby.' : 'Your room will be hidden and only accessible via a code.'}</p>
          </div>

          <div>
            <label className="block font-bold text-sm text-gray-300 mb-2">Game Mode</label>
            <div className="flex space-x-2">
                <RoomModeButton label="1v1" description="2 Players" isActive={mode === '1v1'} onClick={() => setMode('1v1')} />
                <RoomModeButton label="2v2" description="4 Players" isActive={mode === '2v2'} onClick={() => setMode('2v2')} />
                <RoomModeButton label="Libre" description="2-4 Players" isActive={mode === 'free'} onClick={() => setMode('free')} />
            </div>
          </div>
          
          <div>
            <label htmlFor="room-name" className="block font-bold text-sm text-gray-300 mb-2">Room Name</label>
            <input
              type="text"
              id="room-name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
              placeholder="e.g., Legends Table"
              maxLength={20}
            />
          </div>

          <div className="p-4 bg-gray-900/50 rounded-md border border-gray-700">
            <p className="font-bold text-sm text-gray-300 mb-2">Game Type: <span className="text-amber-300 capitalize">Cash Play ({variant})</span></p>
            <div className="flex space-x-4">
                <div className="flex-1">
                    <label htmlFor="bet-amount" className="block font-bold text-xs text-gray-400 mb-1">Bet Amount</label>
                    <input
                      type="number"
                      id="bet-amount"
                      value={betAmount}
                      onChange={e => setBetAmount(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                      step="0.01"
                      min="0"
                    />
                </div>
                 <div className="flex-1">
                    <label htmlFor="score-to-win" className="block font-bold text-xs text-gray-400 mb-1">Score to Win</label>
                    <input
                      type="number"
                      id="score-to-win"
                      value={scoreToWin}
                      onChange={e => setScoreToWin(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                      step="50"
                      min="50"
                      max="500"
                    />
                </div>
            </div>
            <div className="mt-4">
                <label className="block font-bold text-xs text-gray-400 mb-1">Currency</label>
                <div className="flex space-x-4">
                    <button type="button" onClick={() => setCurrency('USDT')} className={`flex-1 p-3 rounded-md flex items-center justify-center space-x-2 font-bold border-2 transition-colors ${currency === 'USDT' ? 'bg-green-500/20 border-green-500 text-white' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}>
                        <UsdtIcon className="w-5 h-5"/> <span>USDT</span>
                    </button>
                    <button type="button" onClick={() => setCurrency('native')} className={`flex-1 p-3 rounded-md flex items-center justify-center space-x-2 font-bold border-2 transition-colors ${currency === 'native' ? 'bg-yellow-500/20 border-yellow-500 text-white' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}>
                        <BnbIcon className="w-5 h-5"/> <span>{nativeCurrencySymbol}</span>
                    </button>
                </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          <div className="flex justify-end space-x-4 pt-2">
            <button type="button" onClick={onClose} className="font-display bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50" disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="font-display bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-green-800 disabled:cursor-wait" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;