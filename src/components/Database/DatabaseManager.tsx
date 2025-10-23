import React, { useState } from 'react';
import { Database, Upload, CheckCircle, AlertCircle, Radio } from 'lucide-react';
import { populateGames } from '../../scripts/populateGames';
import { populateStreams, populateChatMessages } from '../../scripts/populateStreams';

const DatabaseManager: React.FC = () => {
  const [gamesLoading, setGamesLoading] = useState(false);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [gamesStatus, setGamesStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [streamsStatus, setStreamsStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [gamesMessage, setGamesMessage] = useState('');
  const [streamsMessage, setStreamsMessage] = useState('');

  const handlePopulateGames = async () => {
    setGamesLoading(true);
    setGamesStatus('idle');
    setGamesMessage('');

    try {
      const result = await populateGames();
      setGamesStatus('success');
      setGamesMessage(`Successfully populated ${result?.length || 0} games in the database!`);
    } catch (error) {
      setGamesStatus('error');
      setGamesMessage(`Error populating games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGamesLoading(false);
    }
  };

  const handlePopulateStreams = async () => {
    setStreamsLoading(true);
    setStreamsStatus('idle');
    setStreamsMessage('');

    try {
      const streams = await populateStreams();
      await populateChatMessages();
      setStreamsStatus('success');
      setStreamsMessage(`Successfully created ${streams?.length || 0} live streams with chat messages!`);
    } catch (error) {
      setStreamsStatus('error');
      setStreamsMessage(`Error populating streams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setStreamsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl min-w-[320px]">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-cyan-400" />
          <h3 className="text-white font-bold">Database Manager</h3>
        </div>

        <div className="space-y-4">
          {/* Games Section */}
          <div className="space-y-3">
            <button
              onClick={handlePopulateGames}
              disabled={gamesLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
            >
              {gamesLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Populating Games...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Populate Games
                </>
              )}
            </button>

            {gamesStatus !== 'idle' && (
              <div className={`flex items-start gap-2 p-3 rounded-lg ${
                gamesStatus === 'success' 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                {gamesStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${
                  gamesStatus === 'success' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {gamesMessage}
                </p>
              </div>
            )}
          </div>

          {/* Streams Section */}
          <div className="space-y-3">
            <button
              onClick={handlePopulateStreams}
              disabled={streamsLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
            >
              {streamsLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Streams...
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  Create Live Streams
                </>
              )}
            </button>

            {streamsStatus !== 'idle' && (
              <div className={`flex items-start gap-2 p-3 rounded-lg ${
                streamsStatus === 'success' 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                {streamsStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${
                  streamsStatus === 'success' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {streamsMessage}
                </p>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-700">
            <p><strong>Games:</strong> Adds all SNES ROMs with metadata</p>
            <p><strong>Streams:</strong> Creates demo live streams with chat</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManager;