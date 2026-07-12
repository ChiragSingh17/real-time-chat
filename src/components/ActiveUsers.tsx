import { User as UserIcon, Users } from 'lucide-react';
import { User } from '../types';

interface ActiveUsersProps {
  users: User[];
  currentUserId: string;
}

export default function ActiveUsers({ users, currentUserId }: ActiveUsersProps) {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-inner">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-sm tracking-tight text-slate-100">
            Active Users
          </h2>
        </div>
        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
          {users.length} {users.length === 1 ? 'online' : 'online'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {users.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-sans">
            No other users online
          </div>
        ) : (
          users.map((user) => {
            const isMe = user.id === currentUserId;
            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                  isMe
                    ? 'bg-indigo-950/30 border-indigo-500/20 text-indigo-200'
                    : 'bg-slate-800/40 border-transparent hover:bg-slate-800/70 text-slate-300'
                }`}
                id={`user-badge-${user.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 uppercase">
                      {user.username.substring(0, 2)}
                    </div>
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                  </div>
                  <span className="text-xs font-semibold truncate">
                    {user.username} {isMe && <span className="text-[10px] text-indigo-400 font-normal ml-0.5">(You)</span>}
                  </span>
                </div>
                
                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/5 px-1.5 py-0.5 rounded-md border border-emerald-500/10">
                  online
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Sync Active</span>
        </div>
      </div>
    </div>
  );
}
