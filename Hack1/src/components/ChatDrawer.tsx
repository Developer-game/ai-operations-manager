'use client';

import React, { useState, useRef, useEffect } from 'react';
import { store } from '@/lib/store';
import { handleChatbotMessage, PendingActionProposal, ChatHistoryItem } from '@/lib/agents/roleAwareChatbot';
import { SanitizedText } from './SanitizedText';
import { Sparkles, X, Send, ShieldAlert, CheckCircle, AlertTriangle, Cpu, Loader2 } from 'lucide-react';
import { PermissionCode } from '@/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  pendingAction?: PendingActionProposal;
  quickReplies?: string[];
  modelUsed?: string;
}

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const currentUser = store.getCurrentUser();
  const currentOrg = store.getCurrentOrg();
  const { membership, role } = store.getCurrentMembership();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute role label for header
  const isOwner = currentOrg?.ownerUserId === currentUser?.id || role?.isOwner;
  const isOrganiser = isOwner || role?.name.toLowerCase().includes('organiser');
  const userTeam = membership?.teamId && currentOrg ? store.getTeams(currentOrg.id).find((t) => t.id === membership.teamId) : null;
  const isTeamLead = userTeam?.leadUserId === currentUser?.id;

  let roleLabel = 'Member';
  if (isOrganiser) roleLabel = 'Organiser';
  else if (isTeamLead) roleLabel = 'Team Lead';
  else if (role?.name) roleLabel = role.name;

  const firstName = currentUser?.fullName.split(' ')[0] || 'User';
  const chatHeaderTitle = `Chatting as ${firstName} (${roleLabel})`;

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello ${firstName}. I am Rally AI. How can I assist you with ${currentOrg?.name || 'your society'} today?`,
      quickReplies: isOrganiser
        ? ['Summary of upcoming events', 'How many members are registered?', 'Check all pending tasks']
        : isTeamLead
        ? ['Show my team tasks', 'Who is in my team?', 'Upcoming events']
        : ['What are my tasks?', 'Who is my team lead?', 'Upcoming events'],
    },
  ]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || !currentUser) return;

    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    // Prepare history payload for multi-turn conversation
    const historyPayload: ChatHistoryItem[] = nextMessages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      const response = await handleChatbotMessage(currentUser.id, text.trim(), historyPayload);
      const botMsg: MessageItem = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        pendingAction: response.pendingAction,
        quickReplies: response.quickReplies,
        modelUsed: response.modelUsed || 'gemma-4-26b-a4b-it',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: 'I encountered an issue processing your request. Please try asking again.',
          modelUsed: 'gemma-4-26b-a4b-it',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAuthorizeAction = (action: PendingActionProposal) => {
    if (action.actionType === 'TOGGLE_PERMISSION') {
      const { roleId, permission } = action.payload as { roleId: string; permission: PermissionCode };
      const roles = currentOrg ? store.getRoles(currentOrg.id) : [];
      const targetRole = roles.find((r) => r.id === roleId);

      if (targetRole) {
        const updatedPermissions = targetRole.permissions.includes(permission)
          ? targetRole.permissions.filter((p) => p !== permission)
          : [...targetRole.permissions, permission];

        store.updateRolePermissions(roleId, updatedPermissions);
        store.logAction(
          `role.permission.update`,
          'role',
          roleId,
          { roleName: targetRole.name, permission }
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            sender: 'assistant',
            text: `Authorized successfully. The permission "${permission}" has been applied to ${targetRole.name}.`,
            modelUsed: 'gemma-4-26b-a4b-it',
          },
        ]);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      role="dialog"
      aria-label="Society AI Assistant"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header with Role Identity Banner */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'var(--brand-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                {chatHeaderTitle}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Rally AI Assistant
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.5rem',
            }}
            aria-label="Close Assistant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    backgroundColor: isUser ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)',
                    color: isUser ? '#fff' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <SanitizedText>{msg.text}</SanitizedText>
                </div>

                {/* Confirmation Box for Pending Actions */}
                {msg.pendingAction && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-focus)',
                      backgroundColor: 'var(--brand-primary-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: 'var(--brand-primary-text)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <ShieldAlert size={16} />
                      <span>Authorization Required</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      <SanitizedText>{msg.pendingAction.summary}</SanitizedText>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleAuthorizeAction(msg.pendingAction!)}
                        className="btn btn-primary"
                        style={{ minHeight: '34px', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <CheckCircle size={14} />
                        <span>Confirm and Execute</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick replies */}
                {msg.quickReplies && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => handleSend(qr)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--brand-primary-text)',
                          cursor: 'pointer',
                        }}
                      >
                        <SanitizedText>{qr}</SanitizedText>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
              }}
            >
              <Loader2 size={14} className="animate-spin" />
              <span>Gemma 4 is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <input
            type="text"
            placeholder={
              isOrganiser
                ? 'Ask about members, events, or permissions...'
                : isTeamLead
                ? 'Ask about your team, tasks, or events...'
                : 'Ask about your tasks, team lead, or events...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="btn btn-primary"
            style={{
              padding: '0 1rem',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
