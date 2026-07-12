import { useState, FormEvent } from 'react';
import { Terminal, Send, RefreshCw, Code, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RestApiPanelProps {
  currentUsername: string;
  currentUserId: string;
  onRefreshMessages: () => void;
}

export default function RestApiPanel({ currentUsername, currentUserId, onRefreshMessages }: RestApiPanelProps) {
  const [restText, setRestText] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'POST' | 'GET'>('POST');
  const [successNotice, setSuccessNotice] = useState(false);

  const testGetHistory = async () => {
    setIsLoading(true);
    setApiResponse(null);
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setApiResponse(data);
      onRefreshMessages(); // Refresh chat parent state
    } catch (err: any) {
      setApiResponse({ error: err.message || 'Failed to fetch history via REST API' });
    } finally {
      setIsLoading(false);
    }
  };

  const testPostMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!restText.trim()) return;

    setIsLoading(true);
    setApiResponse(null);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: restText.trim(),
          senderName: `${currentUsername} (REST)`,
          senderId: currentUserId,
        }),
      });
      const data = await res.json();
      setApiResponse(data);
      setRestText('');
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 3000);
      onRefreshMessages(); // Refresh chat parent state
    } catch (err: any) {
      setApiResponse({ error: err.message || 'Failed to send message via REST API' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Terminal className="w-5 h-5 text-emerald-400" />
        <h2 className="font-semibold text-sm tracking-tight text-slate-100 font-sans">
          REST API Playground
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl mb-4 border border-slate-800">
        <button
          onClick={() => {
            setActiveTab('POST');
            setApiResponse(null);
          }}
          className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
            activeTab === 'POST'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          POST /api/messages
        </button>
        <button
          onClick={() => {
            setActiveTab('GET');
            setApiResponse(null);
          }}
          className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
            activeTab === 'GET'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          GET /api/messages
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {activeTab === 'POST' ? (
          <form onSubmit={testPostMessage} className="space-y-3">
            <div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                Send a real message using an HTTP POST call. The backend will save it and broadcast it instantly to all Socket.io clients!
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={restText}
                  onChange={(e) => setRestText(e.target.value)}
                  placeholder="Test HTTP POST message..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none transition-all placeholder-slate-600 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !restText.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-slate-900 font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Trigger POST API Request
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Query the absolute current chat logs directly via the Express REST endpoint.
            </p>
            <button
              onClick={testGetHistory}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-slate-900 font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Fetch History via GET API
            </button>
          </div>
        )}

        {/* Live Response Logger */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Code className="w-3 h-3 text-emerald-400" /> API Live JSON Response
            </span>
            {successNotice && (
              <span className="text-emerald-400 flex items-center gap-0.5 font-sans font-medium">
                <Check className="w-3 h-3" /> Broadcast Successful!
              </span>
            )}
          </div>
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] text-emerald-400 custom-scrollbar select-text leading-tight">
            {apiResponse ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin mr-1.5 text-slate-500" /> Running request...
              </div>
            ) : (
              <div className="text-slate-600 italic h-full flex items-center justify-center text-center">
                Execute a request to inspect HTTP payloads
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
