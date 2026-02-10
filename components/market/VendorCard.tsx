'use client';

import type { Vendor, VendorItem } from '@/lib/market/types';

interface VendorCardProps {
  vendor: Vendor;
  onSelect: () => void;
  isSelected?: boolean;
}

export function VendorCard({ vendor, onSelect, isSelected }: VendorCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? 'border-amber-500 bg-amber-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
      }`}
    >
      <span className="text-4xl">{vendor.avatar}</span>
      <div className="text-center">
        <p className="font-semibold text-gray-900">{vendor.displayName}</p>
        <p className="text-sm text-gray-500">{vendor.specialty}</p>
      </div>
    </button>
  );
}

interface ItemCardProps {
  item: VendorItem;
  onSelect: () => void;
  isSelected?: boolean;
}

export function ItemCard({ item, onSelect, isSelected }: ItemCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-gray-200 bg-white hover:border-emerald-300'
      }`}
    >
      <span className="text-3xl">{item.image}</span>
      <div className="flex-1 text-left">
        <p className="font-medium text-gray-900">{item.nameVietnamese}</p>
        <p className="text-sm text-gray-500">{item.name}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-emerald-600">
          {item.basePrice.toLocaleString()}đ
        </p>
      </div>
    </button>
  );
}
