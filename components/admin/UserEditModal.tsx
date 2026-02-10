'use client';

import { useState } from 'react';
import { X, User, Star, Loader2, Clock, Crown, XCircle } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  subscription_tier: 'plus' | 'pro' | null;
  vip_expires_at: string | null;
  is_admin: boolean;
  is_moderator: boolean;
  cards_viewed: number;
  cards_mastered: number;
  current_streak: number;
  created_at: string;
}

interface UserEditModalProps {
  user: UserData;
  onClose: () => void;
  onUpdate: () => void;
}

const DURATION_OPTIONS = [
  { key: '1w', label: '1 Week' },
  { key: '1m', label: '1 Month' },
  { key: '3m', label: '3 Months' },
  { key: '1y', label: '1 Year' },
] as const;

export default function UserEditModal({ user, onClose, onUpdate }: UserEditModalProps) {
  const [selectedTier, setSelectedTier] = useState<'plus' | 'pro'>(user.subscription_tier || 'plus');
  const [selectedDuration, setSelectedDuration] = useState<string>('1m');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasVip = user.subscription_tier && (!user.vip_expires_at || new Date(user.vip_expires_at) > new Date());

  const formatExpiration = (dateStr: string | null) => {
    if (!dateStr) return 'Permanent';
    const date = new Date(dateStr);
    const now = new Date();
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `${days} days left`;
  };

  const handleGrant = async () => {
    setActionLoading('grant');
    setError(null);
    try {
      const res = await fetch('/api/admin/vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tier: selectedTier, duration: selectedDuration }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to grant VIP');
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async () => {
    setActionLoading('extend');
    setError(null);
    try {
      const res = await fetch('/api/admin/vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tier: user.subscription_tier, duration: selectedDuration }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to extend VIP');
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke VIP status?')) return;
    setActionLoading('revoke');
    setError(null);
    try {
      const res = await fetch('/api/admin/vip', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to revoke VIP');
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{user.display_name || user.username}</span>
                {user.is_admin && <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded font-medium">Admin</span>}
                {user.is_moderator && <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-medium">Mod</span>}
              </div>
              <p className="text-sm text-gray-700">@{user.username}</p>
              {user.email && <p className="text-xs text-gray-600">{user.email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-emerald-600">{user.cards_viewed}</p>
              <p className="text-xs font-medium text-gray-700">Cards Viewed</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-emerald-600">{user.cards_mastered}</p>
              <p className="text-xs font-medium text-gray-700">Mastered</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-orange-600">{user.current_streak}</p>
              <p className="text-xs font-medium text-gray-700">Streak</p>
            </div>
          </div>
        </div>

        {/* VIP Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-gray-900">VIP Status</h4>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {hasVip ? (
            <div className="space-y-4">
              {/* Current Status */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-amber-900">{user.subscription_tier?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-amber-800">
                    <Clock className="w-4 h-4" />
                    {formatExpiration(user.vip_expires_at)}
                  </div>
                </div>
              </div>

              {/* Extend Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Extend by</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setSelectedDuration(d.key)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium ${
                        selectedDuration === d.key
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-gray-300 text-gray-800 hover:border-gray-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExtend}
                  disabled={!!actionLoading}
                  className="flex-1 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {actionLoading === 'extend' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Extend VIP'}
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={!!actionLoading}
                  className="px-4 py-2 text-red-700 font-medium hover:bg-red-50 rounded-lg border border-red-300"
                >
                  {actionLoading === 'revoke' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">This user doesn&apos;t have VIP status.</p>

              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tier</label>
                <div className="flex gap-2">
                  {(['plus', 'pro'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                        selectedTier === t
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className={`font-semibold ${selectedTier === t ? 'text-amber-900' : 'text-gray-900'}`}>
                        {t === 'plus' ? 'Plus' : 'Pro'}
                      </div>
                      <div className={`text-xs ${selectedTier === t ? 'text-amber-700' : 'text-gray-600'}`}>
                        {t === 'plus' ? '30 cards/cycle' : 'Unlimited'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setSelectedDuration(d.key)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium ${
                        selectedDuration === d.key
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-gray-300 text-gray-800 hover:border-gray-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGrant}
                disabled={!!actionLoading}
                className="w-full py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading === 'grant' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Grant VIP Access'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
