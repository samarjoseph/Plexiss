import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Sparkles, Globe, ExternalLink, FileSpreadsheet, Copy, Check, AlertTriangle, RotateCcw } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

export default function MessageBubbleV2({ message, onRetry }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(typeof message.text === 'string' ? message.text : '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── User messages ── */
  if (message.sender === 'user') {
    if (message.isFileCard) {
      return (
        <motion.div
          className="v2-msg-file-card"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="v2-msg-file-icon">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="v2-msg-file-name">{message.fileName}</div>
            <div className="v2-msg-file-size">{message.fileSize}</div>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="v2-msg-user-wrap">
        <div className="v2-msg-user-bubble" style={{ whiteSpace: 'pre-wrap' }}>
          {message.text}
        </div>
        <div className="v2-msg-actions v2-msg-actions-right">
          <Tooltip label="Copy message" side="top">
            <button type="button" className="v2-copy-btn" onClick={handleCopy}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  /* ── System Error Messages ── */
  if (message.sender === 'system_error') {
    return (
      <motion.div
        className="v2-msg-system-error"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="v2-error-card">
          <div className="v2-error-header">
            <AlertTriangle size={18} className="v2-error-icon" />
            <span>Unable to send your message</span>
          </div>
          <div className="v2-error-body">
            <p>{message.text}</p>
            <ul>
              <li>Your internet connection</li>
              <li>Whether the server is online</li>
            </ul>
            <div className="v2-error-actions">
              <button 
                type="button" 
                className="v2-retry-btn" 
                onClick={() => onRetry?.(message)}
              >
                <RotateCcw size={14} />
                Retry
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── AI messages ── */
  return (
    <motion.div
      className="v2-msg-ai"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="v2-msg-ai-avatar">
        <Sparkles size={13} />
      </div>

      <div className="v2-msg-ai-body">
        <div className="v2-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {typeof message.text === 'string' ? message.text : ''}
          </ReactMarkdown>
        </div>

        {message.source === 'SOURCE_WEB_SEARCH' && (
          <div className="v2-msg-meta">
            <span className="v2-badge-web">
              <Globe size={12} /> Web Verified
            </span>
            {message.provider && (
              <span className="v2-msg-provider">{message.provider}</span>
            )}
            {message.sources?.length > 0 && (
              <div className="v2-msg-citations">
                {message.sources.slice(0, 4).map((url, idx) => {
                  let domain = 'Source';
                  try {
                    domain = new URL(url).hostname.replace('www.', '');
                  } catch {
                    domain = `Link ${idx + 1}`;
                  }
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="v2-citation"
                    >
                      {domain} <ExternalLink size={10} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {message.insightCard && (
          <div className="v2-insight-card">
            <span className="v2-insight-label">Dataset Insight</span>
            <p>{message.insightCard}</p>
          </div>
        )}

        <div className="v2-msg-actions">
          <Tooltip label="Copy AI response" side="top">
            <button type="button" className="v2-copy-btn" onClick={handleCopy}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            </button>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
}
