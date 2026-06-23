import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ArrowUp, X, FileSpreadsheet, Sparkles,
  Search, LineChart, MessageSquare,
} from 'lucide-react';
import MessageBubbleV2 from './MessageBubbleV2';
import ThinkingV2 from './ThinkingV2';
import { useAuth } from '../../context/AuthContext';

export default function ChatAreaV2({
  messages,
  inputText,
  onInputChange,
  onSend,
  stagedFile,
  onStageFile,
  onCancelFile,
  isLoading,
  activeDatasetName,
  onOpenSidebar,
}) {
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17 && hour < 22) setGreeting('Good evening');
    else setGreeting('Good night');
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea — also runs on mount to fix height after refresh
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 160)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const firstName = user?.name?.split(' ')[0] || '';
  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <main className="v2-chat">
      {/* Header */}
      <header className="v2-chat-header">
        <button
          type="button"
          className="v2-mobile-menu-btn"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <MessageSquare size={18} />
        </button>
        <div className="v2-chat-header-brand">
          Plexis
        </div>
      </header>

      {/* Messages */}
      <div className="v2-chat-messages">
        {showWelcome && (
          <motion.div
            className="v2-welcome"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="v2-welcome-icon">
              <Sparkles size={26} />
            </div>
            <h2>
              {greeting}{firstName ? `, ${firstName}` : ''}
            </h2>
            <p>What would you like to explore today?</p>

            <div className="v2-welcome-cards">
              <button
                type="button"
                className="v2-welcome-card"
                onClick={() => fileRef.current?.click()}
              >
                <div className="v2-welcome-card-icon">
                  <FileSpreadsheet size={18} />
                </div>
                <span className="v2-welcome-card-title">Upload Dataset</span>
                <span className="v2-welcome-card-desc">Analyze CSV files with AI</span>
              </button>

              <button
                type="button"
                className="v2-welcome-card"
                onClick={() => onInputChange('Research the latest trends in AI data analytics.')}
              >
                <div className="v2-welcome-card-icon">
                  <Search size={18} />
                </div>
                <span className="v2-welcome-card-title">Research the Web</span>
                <span className="v2-welcome-card-desc">Get live web insights</span>
              </button>

              <button
                type="button"
                className="v2-welcome-card"
                onClick={() => onInputChange('Generate insights from the current dataset.')}
              >
                <div className="v2-welcome-card-icon">
                  <LineChart size={18} />
                </div>
                <span className="v2-welcome-card-title">Generate Insights</span>
                <span className="v2-welcome-card-desc">Extract patterns & trends</span>
              </button>

              <button
                type="button"
                className="v2-welcome-card"
                onClick={() => onInputChange('Ask Plexis anything.')}
              >
                <div className="v2-welcome-card-icon">
                  <MessageSquare size={18} />
                </div>
                <span className="v2-welcome-card-title">Ask Anything</span>
                <span className="v2-welcome-card-desc">Chat with Plexis AI</span>
              </button>
            </div>
          </motion.div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`v2-msg-row v2-msg-row--${msg.sender}`}
          >
            <MessageBubbleV2 message={msg} />
          </div>
        ))}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="v2-msg-row v2-msg-row--ai"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="v2-msg-ai">
                <div className="v2-msg-ai-avatar">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ fontSize: '0.75rem', lineHeight: 1 }}
                  >
                    ✦
                  </motion.div>
                </div>
                <div className="v2-msg-ai-body">
                  <ThinkingV2 />
                  <div className="v2-thinking-shimmer" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="v2-chat-input-area">
        <div className="v2-input-container">
          {stagedFile && (
            <div className="v2-staged-file">
              <FileSpreadsheet size={14} />
              <span>{stagedFile.name}</span>
              <button type="button" onClick={onCancelFile} aria-label="Remove file">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="v2-input-row">
            <button
              type="button"
              className="v2-attach-btn v2-tip"
              data-tip="Upload Dataset
Ctrl+U"
              onClick={() => fileRef.current?.click()}
              disabled={isLoading}
            >
              <Plus size={18} />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file?.name.endsWith('.csv')) onStageFile(file);
                e.target.value = '';
              }}
            />

            {isLoading ? (
              <div className="v2-input-shimmer">
                <Sparkles size={14} />
                Plexis is thinking...
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                className="v2-input-field"
                placeholder="Message Plexis..."
                rows={1}
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ height: '24px' }}
              />
            )}

            <motion.button
              type="button"
              className="v2-send-btn v2-tip"
              data-tip="Send Message
⏎ Enter"
              disabled={(!inputText.trim() && !stagedFile) || isLoading}
              onClick={onSend}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUp size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  );
}
