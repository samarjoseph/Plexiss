import React, { useState, useEffect, useRef } from 'react';
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
  X,
} from 'lucide-react';

// Mock implementations for isolated preview
function useAuth() {
  return {
    user: { name: 'Demo User', email: 'demo@plexis.app' },
    logout: () => console.log('Logout triggered'),
  };
}

function sortConversations(conversations) {
  if (!conversations) return [];
  return [...conversations].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

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

/* ───────────────────────── Mobile detection hook ──────────────────────── */

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ───────────────────────── Tooltip (Upgraded) ──────────────────────── */

function Tip({ children, label, shortcut, side = 'right', className = '', ...rest }) {
  const [show, setShow] = useState(false);
  const isMobile = useIsMobile();
  const timer = useRef(null);

  // On mobile / touch devices, render children directly — NO tooltip at all.
  if (isMobile) {
    return (
      <div
        className={`v2-tip-wrap ${className}`}
        style={{ position: 'relative', display: 'inline-flex' }}
        {...rest}
      >
        {children}
      </div>
    );
  }

  const handleEnter = () => {
    // 300ms delay to prevent ugly flickering
    timer.current = setTimeout(() => setShow(true), 300);
  };

  const handleLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    setShow(false);
  };

  const pos =
    side === 'right'
      ? { left: 'calc(100% + 14px)', top: '50%', transform: 'translateY(-50%)' }
      : { bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)' };

  // Advanced inline styling applied directly to override ugly CSS
  return (
    <div
      className={`v2-tip-wrap ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: 'relative', display: 'inline-flex' }}
      {...rest}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, x: side === 'right' ? -6 : 0, y: side === 'top' ? 6 : 0 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              ...pos,
              position: 'absolute',
              zIndex: 9999,
              background: 'rgba(15, 15, 15, 0.98)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#f0f2f5', letterSpacing: '0.01em' }}>
              {label}
            </span>
            {shortcut && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#8b95a5',
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.04em'
              }}>
                {shortcut}
              </span>
            )}
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
  onCloseMobile,
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
  const isMobile = useIsMobile();

  const sorted = sortConversations(conversations);
  const { pinned, datasets, recent } = groupConversations(sorted);

  const COLLAPSED_W = 52;
  const EXPANDED_W = 260;
  const MOBILE_W = 300;

  // When collapsed AND not on mobile → show icon rail.
  // On mobile the drawer is always full content.
  const showRail = collapsed && !isMobile;

  // Animation target: width-only on desktop, transform-only on mobile.
  const animateProps = isMobile
    ? { x: mobileOpen ? 0 : '-100%', width: MOBILE_W }
    : { x: 0, width: collapsed ? COLLAPSED_W : EXPANDED_W };

  const sidebarClasses = [
    'v2-sidebar',
    showRail ? 'v2-sidebar--collapsed' : '',
    isMobile ? 'v2-sidebar--mobile' : '',
    mobileOpen ? 'mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Close drawer after selecting a chat on mobile.
  const handleSelect = (id) => {
    onSelectChat(id);
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            className="v2-sidebar-overlay visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={sidebarClasses}
        initial={false}
        animate={animateProps}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{ willChange: 'width, transform' }}
      >
        {/* ── Header ── */}
        <div className="v2-sidebar-header">
          {showRail ? (
            /* Logo acts as toggle when collapsed — hover reveals expand indicator */
            <Tip label="Expand sidebar" shortcut="Ctrl+B" side="right">
              <motion.button
                className="v2-sidebar-logo-btn"
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Sparkles size={20} />
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

              {/* Desktop: collapse chevron. Mobile: robust close drawer icon. */}
              {isMobile ? (
                <button
                  className="v2-sidebar-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onCloseMobile) onCloseMobile();
                    else if (onToggleCollapse) onToggleCollapse();
                  }}
                  aria-label="Close sidebar"
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
              ) : (
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
              )}
            </>
          )}
        </div>

        {/* ── New Chat ── */}
        {showRail ? (
          <Tip label="New Chat" shortcut="Ctrl+Shift+O" side="right">
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
        {showRail ? (
          <Tip label="Search Chats" shortcut="Ctrl+K" side="right">
            <button className="v2-sidebar-icon-btn" onClick={onToggleCollapse}>
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

        {/* ── Chat list ── */}
        {showRail ? (
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
                    onSelect={handleSelect}
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
                    onSelect={handleSelect}
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
                    onSelect={handleSelect}
                    onRename={onRenameChat}
                    onDelete={onDeleteChat}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </div>
            )}

            {pinned.length === 0 && datasets.length === 0 && recent.length === 0 && (
              <div className="v2-sidebar-empty">No conversations yet</div>
            )}
          </div>
        )}

        {/* ── Bottom actions ── */}
        <div className="v2-sidebar-bottom">
          {showRail ? (
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
                <div className="v2-profile-info">
                  <span className="v2-profile-name">{user?.name}</span>
                  <span className="v2-profile-email">{user?.email}</span>
                </div>
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
                style={showRail ? { left: `${COLLAPSED_W + 8}px`, bottom: '12px' } : {}}
              >
                <div className="v2-profile-dropdown-header">
                  {user?.avatar ? (
                    <div className="v2-profile-dropdown-avatar">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="v2-profile-dropdown-avatar">
                      <div className="v2-profile-dropdown-avatar-fallback">
                        {user?.name?.charAt(0) || '?'}
                      </div>
                    </div>
                  )}
                  <div className="v2-profile-dropdown-info">
                    <span className="v2-profile-dropdown-name">{user?.name}</span>
                    <span className="v2-profile-dropdown-email">{user?.email}</span>
                  </div>
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
    </>
  );
}