import { create } from "zustand";

interface ChatState {
  conversationId: string | null;
  isExtracting: boolean;
  setConversationId: (id: string | null) => void;
  setIsExtracting: (value: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversationId: null,
  isExtracting: false,
  setConversationId: (id) => set({ conversationId: id }),
  setIsExtracting: (value) => set({ isExtracting: value }),
}));
