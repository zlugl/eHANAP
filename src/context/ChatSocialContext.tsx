import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ChatMessage,
  ChatConversation,
  CompanyReview,
  ProfileViewEvent,
} from '../types';
import {
  INITIAL_BOOKMARKED_JOB_IDS,
  INITIAL_COMPANY_REVIEWS,
  INITIAL_CONVERSATIONS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_PROFILE_VIEWS,
} from '../data/mockData';
import { storageAdapter } from '../lib/storageAdapter';
import { useAuth } from './AuthContext';

export interface ChatSocialContextType {
  bookmarkedJobIds: string[];
  toggleBookmarkJob: (jobId: string) => void;
  isJobBookmarked: (jobId: string) => boolean;
  conversations: ChatConversation[];
  chatMessages: ChatMessage[];
  sendChatMessage: (conversationId: string, text: string, audioUrl?: string, attachmentName?: string) => void;
  markConversationRead: (conversationId: string) => void;
  companyReviews: CompanyReview[];
  addCompanyReview: (review: Omit<CompanyReview, 'id' | 'createdAt'>) => void;
  profileViews: ProfileViewEvent[];
  resetChatSocialState: () => void;
}

export const ChatSocialContext = createContext<ChatSocialContextType | undefined>(undefined);

export const ChatSocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>(() => {
    return storageAdapter.getBookmarks(INITIAL_BOOKMARKED_JOB_IDS);
  });
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [companyReviews, setCompanyReviews] = useState<CompanyReview[]>(INITIAL_COMPANY_REVIEWS);
  const [profileViews, setProfileViews] = useState<ProfileViewEvent[]>(INITIAL_PROFILE_VIEWS);

  useEffect(() => {
    storageAdapter.setBookmarks(bookmarkedJobIds);
  }, [bookmarkedJobIds]);

  const toggleBookmarkJob = (jobId: string) => {
    setBookmarkedJobIds(prev => {
      const exists = prev.includes(jobId);
      return exists ? prev.filter(id => id !== jobId) : [jobId, ...prev];
    });
  };

  const isJobBookmarked = (jobId: string) => bookmarkedJobIds.includes(jobId);

  const sendChatMessage = (conversationId: string, text: string, audioUrl?: string, attachmentName?: string) => {
    if (!currentUser) return;
    const targetConv = conversations.find(c => c.id === conversationId);
    const newMsg: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      recipientId: targetConv?.participantId || 'unknown',
      text,
      audioUrl,
      attachmentName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };
    setChatMessages(prev => [...prev, newMsg]);
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: text || (audioUrl ? '🎤 Voice message' : '📎 Attachment'),
          lastMessageTime: newMsg.timestamp,
        };
      }
      return conv;
    }));

    if (currentUser.role === 'job_seeker') {
      setTimeout(() => {
        const autoReplies = [
          "Thank you for your update! I am checking your credentials with our hiring committee.",
          "Noted on this! Let's schedule an interview slot on our calendar.",
          "Received! Your profile has high alignment with our department requirements."
        ];
        const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        const replyMsg: ChatMessage = {
          id: `msg-${crypto.randomUUID()}`,
          conversationId,
          senderId: targetConv?.participantId || 'user-emp-1',
          senderName: targetConv?.participantName || 'Jenny Wilson',
          senderAvatar: targetConv?.participantAvatar,
          senderRole: 'employer',
          recipientId: currentUser.id,
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        };
        setChatMessages(msgs => [...msgs, replyMsg]);
        setConversations(convs => convs.map(c => c.id === conversationId ? {
          ...c,
          lastMessage: randomReply,
          lastMessageTime: replyMsg.timestamp,
          unreadCount: c.unreadCount + 1,
        } : c));
      }, 1500);
    }
  };

  const markConversationRead = (conversationId: string) => {
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
    setChatMessages(prev => prev.map(m => m.conversationId === conversationId ? { ...m, isRead: true } : m));
  };

  const addCompanyReview = (review: Omit<CompanyReview, 'id' | 'createdAt'>) => {
    const newRev: CompanyReview = {
      ...review,
      id: `rev-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    setCompanyReviews(prev => [newRev, ...prev]);
  };

  const resetChatSocialState = () => {
    setBookmarkedJobIds([]);
    setConversations([]);
    setChatMessages([]);
    setCompanyReviews([]);
    setProfileViews([]);
  };

  return (
    <ChatSocialContext.Provider
      value={{
        bookmarkedJobIds,
        toggleBookmarkJob,
        isJobBookmarked,
        conversations,
        chatMessages,
        sendChatMessage,
        markConversationRead,
        companyReviews,
        addCompanyReview,
        profileViews,
        resetChatSocialState,
      }}
    >
      {children}
    </ChatSocialContext.Provider>
  );
};

export const useChatSocial = (): ChatSocialContextType => {
  const context = useContext(ChatSocialContext);
  if (!context) {
    throw new Error('useChatSocial must be used within a ChatSocialProvider');
  }
  return context;
};
