import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  MessageSquare,
  FileSpreadsheet,
  MoreHorizontal,
  Pencil,
  Trash2,
  LogOut,
  Sparkles,
  Settings,
  ChevronsLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sortConversations } from '../../utils/conversationStorage';

/* ───────────────────────── helpers ───────────────────────── */

function relativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupConversations(conversations) {
  const pinned = [];
  const datasets = [];
  const recent = [];
  for (const c of conversations) {
    if (c.pinned) pinned.push(c);
    else if (c.datasetName) datasets.push(c);
    else recent.push(c);
  }
  return { pinned, datasets, recent };
}

/* ───────────────────────── Tooltip ──────────────────────── */

function Tip({ children, label, shortcut, side = 'right', className = '', ...rest }) {
  const [show, setShow] = useState(false);

  const pos =
    side === 'right'
      ? { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 10 }
      : side === 'top'
      ? { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 }
      : { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 };

  return (
    <div
      className={`v2-tip-wrap ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ position: 'relative', display: 'inline-flex' }}
      {...rest}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            className="v2-tooltip"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...pos, position: 'absolute' }}
          >
            <span className="v2-tooltip-label">{label}</span>
            {shortcut && <span className="v2-tooltip-shortcut">{shortcut}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── ChatItem ─────────────────────── */

function ChatItem({
  chat,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(chat.title);

  const commitRename = () => {
    const trimmed = renameVal.trim();
    if (trimmed && trimmed !== chat.title) onRename(chat.id, trimmed);
    setRenaming(false);
  };

  return (
    <div
      className={`v2-chat-item${isActive ? ' active' : ''}`}
      onClick={() => !renaming && onSelect(chat.id)}
    >
      <MessageSquare size={16} />

      {renaming ? (
        <input
          className="v2-rename-input"
          value={renameVal}
          autoFocus
          onChange={(e) => setRenameVal(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="v2-chat-item-title">{chat.title}</span>
      )}

      <span className="v2-chat-item-time">{relativeTime(chat.updatedAt)}</span>

      <button
        className="v2-chat-item-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
      >
        <MoreHorizontal size={14} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="v2-context-menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setRenaming(true);
                setRenameVal(chat.title);
                setMenuOpen(false);
              }}
            >
              <Pencil size={14} /> Rename
            </button>
            <button
              onClick={() => {
                onTogglePin(chat.id);
                setMenuOpen(false);
              }}
            >
              {chat.pinned ? <PinOff size={14} /> : <Pin size={14} />}
              {chat.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              className="danger"
              onClick={() => {
                onDelete(chat.id);
                setMenuOpen(false);
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────── SidebarV2 ─────────────────────── */

export default function SidebarV2({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  conversations,
  activeId,
  searchQuery,
  onSearchChange,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onTogglePin,
  onOpenSettings,
}) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const sorted = sortConversations(conversations);
  const { pinned, datasets, recent } = groupConversations(sorted);

  const sidebarClasses = [
    'v2-sidebar',
    collapsed ? 'v2-sidebar--collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const COLLAPSED_W = 52;
  const EXPANDED_W = 260;

  return (
    <motion.aside
      className={sidebarClasses}
      animate={{ width: collapsed && !mobileOpen ? COLLAPSED_W : EXPANDED_W }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Header ── */}
      <div className="v2-sidebar-header">
        {collapsed ? (
          /* Logo acts as toggle when collapsed — hover reveals expand indicator */
          <Tip label="Expand sidebar" shortcut="Ctrl+B" side="right">
            <motion.button
              className="v2-sidebar-logo-btn"
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <Sparkles size={20} />
              {/* Subtle expand overlay on hover */}
              <motion.div
                className="v2-logo-expand-hint"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
            </motion.button>
          </Tip>
        ) : (
          <>
            <div className="v2-sidebar-logo">
              <Sparkles size={20} />
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                Plexis
              </motion.span>
            </div>
            <Tip label="Collapse" shortcut="Ctrl+B" side="top">
              <motion.button
                className="v2-sidebar-toggle"
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.06)' }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronsLeft size={16} />
              </motion.button>
            </Tip>
          </>
        )}
      </div>

      {/* ── New Chat ── */}
      {collapsed ? (
        <Tip label="New Chat" shortcut="Ctrl+K" side="right">
          <motion.button
            className="v2-new-chat-btn v2-new-chat-btn--icon"
            onClick={onNewChat}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <Plus size={16} />
          </motion.button>
        </Tip>
      ) : (
        <motion.button
          className="v2-new-chat-btn"
          onClick={onNewChat}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </motion.button>
      )}

      {/* ── Search ── */}
      {collapsed ? (
        <Tip label="Search Chats" shortcut="Ctrl+K" side="right">
          <button
            className="v2-sidebar-icon-btn"
            onClick={onToggleCollapse}
          >
            <Search size={16} />
          </button>
        </Tip>
      ) : (
        <div className="v2-sidebar-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search chats…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      {/* ── Chat list (HIDDEN when collapsed) ── */}
      {collapsed ? (
        <div className="v2-sidebar-list" />
      ) : (
        <div className="v2-sidebar-list">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="v2-sidebar-section">
              <div className="v2-sidebar-section-label">
                <Pin size={12} /> Pinned
              </div>
              {pinned.map((c) => (
                <ChatItem
                  key={c.id}
                  chat={c}
                  isActive={c.id === activeId}
                  onSelect={onSelectChat}
                  onRename={onRenameChat}
                  onDelete={onDeleteChat}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          )}

          {/* Datasets */}
          {datasets.length > 0 && (
            <div className="v2-sidebar-section">
              <div className="v2-sidebar-section-label">
                <FileSpreadsheet size={12} /> Datasets
              </div>
              {datasets.map((c) => (
                <ChatItem
                  key={c.id}
                  chat={c}
                  isActive={c.id === activeId}
                  onSelect={onSelectChat}
                  onRename={onRenameChat}
                  onDelete={onDeleteChat}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <div className="v2-sidebar-section">
              <div className="v2-sidebar-section-label">
                <MessageSquare size={12} /> Recent
              </div>
              {recent.map((c) => (
                <ChatItem
                  key={c.id}
                  chat={c}
                  isActive={c.id === activeId}
                  onSelect={onSelectChat}
                  onRename={onRenameChat}
                  onDelete={onDeleteChat}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom actions ── */}
      <div className="v2-sidebar-bottom">
        {collapsed ? (
          <div className="v2-sidebar-dock">
            <Tip label="Settings" side="right">
              <button className="v2-sidebar-icon-btn" onClick={onOpenSettings}>
                <Settings size={16} />
              </button>
            </Tip>
            <Tip label={user?.name || 'Profile'} side="right">
              <button
                className="v2-sidebar-icon-btn"
                onClick={() => setProfileOpen((v) => !v)}
              >
                {user?.avatar ? (
                  <img
                    className="v2-profile-avatar-sm"
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="v2-profile-avatar-fallback-sm">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
              </button>
            </Tip>
          </div>
        ) : (
          <div className="v2-sidebar-profile">
            <button
              className="v2-profile-btn"
              onClick={() => setProfileOpen((v) => !v)}
            >
              {user?.avatar ? (
                <img
                  className="v2-profile-avatar"
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="v2-profile-avatar-fallback">
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
              <span className="v2-profile-name">{user?.name}</span>
              <span className="v2-profile-email">{user?.email}</span>
            </button>
          </div>
        )}

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              className="v2-profile-dropdown"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={collapsed ? { left: `${COLLAPSED_W + 8}px`, bottom: '12px' } : {}}
            >
              <div className="v2-profile-dropdown-header">
                {user?.avatar ? (
                  <img
                    className="v2-profile-avatar"
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="v2-profile-avatar-fallback">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="v2-profile-name">{user?.name}</span>
                <span className="v2-profile-email">{user?.email}</span>
              </div>

              <div className="v2-profile-dropdown-divider" />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onOpenSettings();
                }}
              >
                <Settings size={15} /> Settings
              </button>
              <button
                className="danger"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
              >
                <LogOut size={15} /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
