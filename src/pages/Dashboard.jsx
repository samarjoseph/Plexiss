import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, BarChart3, WifiOff } from 'lucide-react';
import { PlexisAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import {
  loadConversations,
  saveConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  renameConversation,
  togglePinConversation,
} from '../utils/conversationStorage';
import { extractResponseText, extractMetadata } from '../utils/responseHelpers';
import SidebarV2 from '../components/dashboard/SidebarV2';
import ChatAreaV2 from '../components/dashboard/ChatAreaV2';
import AnalyticsPanelV2 from '../components/dashboard/AnalyticsPanelV2';
import SettingsPanelV2 from '../components/dashboard/SettingsPanelV2';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

  // ── State ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [stagedFile, setStagedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // ── Load from storage ──────────────────────────────────────
  useEffect(() => {
    const stored = loadConversations(userId);
    if (stored.length > 0) {
      setConversations(stored);
      setActiveId(stored[0].id);
    }
  }, [userId]);

  // ── Persist to storage ─────────────────────────────────────
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(userId, conversations);
    }
  }, [conversations, userId]);

  // ── Helpers ────────────────────────────────────────────────
  const showToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleNewChat = () => {
    setActiveId(null);
    setInputText('');
    setStagedFile(null);
    setSidebarMobileOpen(false);
  };

  const handleSelectChat = (id) => {
    setActiveId(id);
    setSidebarMobileOpen(false);
  };

  // ── Send Message ───────────────────────────────────────────
  const handleSend = async () => {
    if (!inputText.trim() && !stagedFile) return;

    const runtimeFile = stagedFile;
    const runtimeText = inputText;
    const userMessages = [];

    if (runtimeFile) {
      userMessages.push({
        id: `file-${Date.now()}`,
        sender: 'user',
        isFileCard: true,
        fileName: runtimeFile.name,
        fileSize: `${(runtimeFile.size / 1024).toFixed(1)} KB`,
      });
    }
    if (runtimeText.trim()) {
      userMessages.push({
        id: `text-${Date.now()}`,
        sender: 'user',
        text: runtimeText,
      });
    }

    // Lazy conversation creation
    let currentConv = activeConversation;
    let targetId = activeId;

    if (!currentConv) {
      currentConv = createConversation();
      currentConv.messages = [];
      targetId = currentConv.id;
      setConversations((prev) => [currentConv, ...prev]);
      setActiveId(targetId);
    }

    const updatedMessages = [...currentConv.messages, ...userMessages];
    setConversations((prev) => updateConversation(prev, targetId, { messages: updatedMessages }));
    setInputText('');
    setStagedFile(null);
    setIsLoading(true);

    try {
      let apiResult;
      if (runtimeFile) {
        apiResult = await PlexisAPI.uploadCSV(runtimeFile, runtimeText);
      } else {
        apiResult = await PlexisAPI.askQuestion(runtimeText, currentConv.activeDatasetName);
      }

      const responseText = extractResponseText(apiResult);
      const responseMeta = extractMetadata(apiResult);

      let nextChartData = currentConv.chartData;
      let nextDatasetName = currentConv.activeDatasetName;
      let nextDatasetStats = currentConv.datasetStats;

      if (runtimeFile) {
        nextDatasetName = runtimeFile.name;
        if (apiResult?.dataset_info) {
          nextDatasetStats = {
            rows: apiResult.dataset_info.rows,
            columns: apiResult.dataset_info.columns,
            memory: apiResult.dataset_info.memory_usage,
            types: apiResult.dataset_info.column_types,
          };
        }
      }

      if (apiResult?.chart_data) {
        nextChartData = {
          labels: apiResult.chart_data.labels,
          datasets: [
            {
              label: apiResult.chart_data.metric_label || 'Dataset Trace',
              data: apiResult.chart_data.values,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderWidth: 2,
            },
          ],
        };
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        hasChart: !!(apiResult?.chart_data),
        source: responseMeta.source,
        provider: responseMeta.provider,
        sources: responseMeta.sources,
        insightCard: runtimeFile
          ? `Dataset "${runtimeFile.name}" ingested and profiled successfully.`
          : null,
      };

      // Generate smart title
      let title = currentConv.title;
      if (title === 'New Chat' && runtimeText.trim()) {
        try {
          const titleResult = await PlexisAPI.askQuestion(
            `Generate a concise conversation title in maximum 5 words for this message. Return ONLY the title, nothing else: "${runtimeText.trim().slice(0, 200)}"`
          );
          const aiTitle = extractResponseText(titleResult)?.trim().replace(/^["']|["']$/g, '');
          if (aiTitle && aiTitle.length > 0 && aiTitle.length < 50) {
            title = aiTitle;
          } else {
            title = runtimeText.trim().split(' ').slice(0, 5).join(' ');
            if (title.length > 35) title = title.slice(0, 32) + '...';
          }
        } catch {
          title = runtimeText.trim().split(' ').slice(0, 5).join(' ');
          if (title.length > 35) title = title.slice(0, 32) + '...';
        }
      }

      setConversations((prev) =>
        updateConversation(prev, targetId, {
          messages: [...updatedMessages, aiMessage],
          chartData: nextChartData,
          activeDatasetName: nextDatasetName,
          datasetName: runtimeFile ? runtimeFile.name : currentConv.datasetName,
          datasetStats: nextDatasetStats,
          title,
        })
      );
    } catch (err) {
      console.error('Plexis API Error:', err);
      showToast('connection', 'connection');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Keyboard Shortcuts ─────────────────────────────────────
  useKeyboardShortcuts([
    { key: 'k', mod: true, action: handleNewChat },
    { key: 'b', mod: true, action: () => setSidebarCollapsed((v) => !v) },
  ]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <motion.div
      className="v2-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Mobile sidebar overlay — tap to close */}
      <div
        className={`v2-sidebar-overlay ${sidebarMobileOpen ? 'visible' : ''}`}
        onClick={() => setSidebarMobileOpen(false)}
      />

      {/*
        SidebarV2:
        - Desktop: logo toggle always visible; sidebar animates width
        - Mobile: overlay sidebar; hamburger in ChatAreaV2 triggers open
      */}
      <SidebarV2
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        conversations={conversations}
        activeId={activeId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={(id, title) => setConversations((p) => renameConversation(p, id, title))}
        onDeleteChat={(id) => {
          const next = deleteConversation(conversations, id);
          setConversations(next);
          if (activeId === id) {
            setActiveId(next.length > 0 ? next[0].id : null);
          }
        }}
        onTogglePin={(id) => setConversations((p) => togglePinConversation(p, id))}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/*
        ChatAreaV2:
        - Desktop: no hamburger shown (logo in sidebar handles toggle)
        - Mobile: hamburger in header triggers onOpenSidebar
      */}
      <ChatAreaV2
        messages={activeConversation?.messages || []}
        inputText={inputText}
        onInputChange={setInputText}
        onSend={handleSend}
        stagedFile={stagedFile}
        onStageFile={setStagedFile}
        onCancelFile={() => setStagedFile(null)}
        isLoading={isLoading}
        activeDatasetName={activeConversation?.activeDatasetName}
        onOpenSidebar={() => setSidebarMobileOpen(true)}
      />

      {/* Floating Analytics Toggle */}
      <motion.button
        className={`v2-analytics-float-btn ${!analyticsCollapsed ? 'active' : ''}`}
        onClick={() => setAnalyticsCollapsed(!analyticsCollapsed)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={analyticsCollapsed ? 'Open Analytics' : 'Close Analytics'}
      >
        <BarChart3 size={18} />
      </motion.button>

      <AnimatePresence>
        {!analyticsCollapsed && (
          <AnalyticsPanelV2
            chartData={activeConversation?.chartData}
            chartType={chartType}
            onChartTypeChange={setChartType}
            collapsed={analyticsCollapsed}
            onToggleCollapse={() => setAnalyticsCollapsed(!analyticsCollapsed)}
            datasetName={activeConversation?.activeDatasetName}
            datasetStats={activeConversation?.datasetStats}
          />
        )}
      </AnimatePresence>

      <SettingsPanelV2
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Toasts */}
      <div className="v2-toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`v2-toast ${toast.type}`}
            >
              {toast.type === 'connection' ? (
                <>
                  <WifiOff size={22} className="v2-toast-icon" />
                  <span className="v2-toast-title">No connection</span>
                  <span className="v2-toast-desc">
                    Please check your internet connection and try again.
                  </span>
                </>
              ) : (
                <>
                  {toast.type === 'error' && (
                    <AlertCircle size={16} className="v2-toast-icon" />
                  )}
                  <span>{toast.message}</span>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
