import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Clock } from 'lucide-react';
import { cn } from '../../../utils/cn';
import Skeleton from '../../../components/ui/Skeleton';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getRoleBadgeColor = (role = '') => {
  const r = role.toLowerCase();
  if (r.includes('super admin') || r.includes('administrator')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  if (r.includes('admin')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (r.includes('pm') || r.includes('lead')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  return 'bg-blue-50 text-blue-700 border-blue-200';
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return timeStr;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
};

const TaskChatSection = ({
  comments = [],
  loading = false,
  currentUser = {},
  onSendMessage,
  isSubmitting = false,
  className = ""
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isMessageFromMe = (comment) => {
    if (currentUser?.id && comment.user_id) {
      return String(currentUser.id) === String(comment.user_id);
    }
    if (currentUser?.name && comment.user_name) {
      return currentUser.name.trim().toLowerCase() === comment.user_name.trim().toLowerCase();
    }
    return false;
  };

  return (
    <section className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col", className)}>
      {/* Chat Section Header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 leading-tight">Team Task & Chat</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Two-way messaging on this task
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {comments.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {comments.length}
            </span>
          )}
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="p-3.5 space-y-3 overflow-y-auto min-h-[180px] max-h-[320px] bg-slate-50/30">
        {loading && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
              <Skeleton className="h-12 w-3/5 rounded-xl" />
            </div>
            <div className="flex items-start justify-end gap-2">
              <Skeleton className="h-12 w-1/2 rounded-xl" />
            </div>
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">No messages yet</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs leading-relaxed">
              Post updates, questions, handover notes, or feedback here.
            </p>
          </div>
        )}

        {!loading && comments.map((comment, index) => {
          const fromMe = isMessageFromMe(comment);
          const roleLabel = comment.role_name || (fromMe && currentUser?.role_name) || (comment.user_name?.toLowerCase?.().includes('admin') ? 'Admin' : 'Developer');

          return (
            <div
              key={comment.id || index}
              className={cn(
                "flex items-end gap-2 group transition-all",
                fromMe ? "justify-end" : "justify-start"
              )}
            >
              {/* Other's Avatar (Left) */}
              {!fromMe && (
                <div
                  title={comment.user_name || 'Team Member'}
                  className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 border border-slate-300 ring-1 ring-white mb-1"
                >
                  {getInitials(comment.user_name)}
                </div>
              )}

              {/* Chat Bubble Container */}
              <div
                className={cn(
                  "flex flex-col max-w-[85%]",
                  fromMe ? "items-end" : "items-start"
                )}
              >
                {/* Header info */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-bold text-slate-800">
                    {fromMe ? 'You' : (comment.user_name || 'Team Member')}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider",
                      getRoleBadgeColor(roleLabel)
                    )}
                  >
                    {roleLabel}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 opacity-60" />
                    {formatTime(comment.created_at)}
                  </span>
                </div>

                {/* Speech Bubble */}
                <div
                  className={cn(
                    "px-3 py-2 text-xs leading-relaxed break-words rounded-xl font-normal",
                    fromMe
                      ? "bg-blue-600 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 rounded-tl-xs border border-slate-200"
                  )}
                >
                  {comment.comment}
                </div>
              </div>

              {/* My Avatar (Right) */}
              {fromMe && (
                <div
                  title="You"
                  className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 ring-1 ring-white mb-1"
                >
                  {getInitials(currentUser?.name || 'You')}
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Composer Bar */}
      <div className="p-2.5 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message... (Enter to send)"
              disabled={isSubmitting}
              className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent border-0 outline-none px-2.5 py-1.5 focus:ring-0"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="Send message"
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span className="text-[11px]">Send</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default TaskChatSection;
