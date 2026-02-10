'use client';

import { useEffect, useRef } from 'react';
import type { ConversationMessage, Vendor } from '@/lib/market/types';
import { AudioButton } from './AudioButton';

interface VendorDialogueProps {
  messages: ConversationMessage[];
  vendor: Vendor;
  currentPrice: number;
}

export function VendorDialogue({ messages, vendor, currentPrice }: VendorDialogueProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50">
      {/* Header with vendor info */}
      <div className="flex items-center gap-3 border-b bg-white px-4 py-3 rounded-t-xl">
        <span className="text-3xl">{vendor.avatar}</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{vendor.displayName}</p>
          <p className="text-sm text-gray-500">{vendor.specialty}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Current Price</p>
          <p className="text-lg font-bold text-emerald-600">
            {currentPrice.toLocaleString()}đ
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 overflow-y-auto p-4"
        style={{ maxHeight: '300px', minHeight: '200px' }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} vendorAvatar={vendor.avatar} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  vendorAvatar,
}: {
  message: ConversationMessage;
  vendorAvatar: string;
}) {
  const isPlayer = message.sender === 'player';

  return (
    <div className={`flex gap-2 ${isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg ${
          isPlayer ? 'bg-emerald-100' : 'bg-amber-100'
        }`}
      >
        {isPlayer ? '🙋' : vendorAvatar}
      </div>

      {/* Bubble */}
      <div
        className={`relative max-w-[75%] rounded-2xl px-4 py-2 ${
          isPlayer
            ? 'bg-emerald-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
        }`}
      >
        {/* Audio button for vendor messages */}
        {!isPlayer && (message.textVietnamese || message.text) && (
          <AudioButton
            text={message.textVietnamese || message.text}
            size="sm"
            variant="ghost"
            className="absolute -top-1 -right-1 bg-white shadow-sm border border-gray-100"
          />
        )}
        {message.textVietnamese && message.textVietnamese !== message.text && (
          <p className={`font-medium ${isPlayer ? 'text-white' : 'text-gray-900'}`}>
            {message.textVietnamese}
          </p>
        )}
        <p className={`text-sm ${isPlayer ? 'text-emerald-100' : 'text-gray-600'}`}>
          {message.text}
        </p>
        {message.priceOffer && (
          <p
            className={`mt-1 text-sm font-semibold ${
              isPlayer ? 'text-emerald-200' : 'text-emerald-600'
            }`}
          >
            💰 {message.priceOffer.toLocaleString()}đ
          </p>
        )}
      </div>
    </div>
  );
}
