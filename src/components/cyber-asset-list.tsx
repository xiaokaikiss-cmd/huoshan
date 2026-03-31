'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  RefreshCw,
  Image,
  Video,
  Music,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Sparkles,
  Copy,
  Timer,
  Trash2,
  Loader2,
} from 'lucide-react';

interface Asset {
  id: string;
  asset_id: string;
  name: string;
  url: string;
  asset_type: 'Image' | 'Video' | 'Audio';
  status: 'Active' | 'Processing' | 'Failed';
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  Active: {
    label: '已激活',
    icon: CheckCircle2,
    className: 'status-active',
  },
  Processing: {
    label: '处理中',
    icon: Clock,
    className: 'status-processing',
  },
  Failed: {
    label: '失败',
    icon: XCircle,
    className: 'status-failed',
  },
};

const assetTypeConfig = {
  Image: { label: '图片', icon: Image, gradient: 'from-cyan-500 to-blue-500' },
  Video: { label: '视频', icon: Video, gradient: 'from-purple-500 to-pink-500' },
  Audio: { label: '音频', icon: Music, gradient: 'from-green-500 to-emerald-500' },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
  exit: { 
    opacity: 0, 
    x: -100, 
    scale: 0.9,
    transition: { duration: 0.3 }
  },
};

export function CyberAssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingTimes, setProcessingTimes] = useState<Record<string, number>>({});
  
  // 删除相关状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      if (data.success) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error('获取素材列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncAllAssets = async () => {
    setSyncing(true);
    try {
      await fetch('/api/assets/sync-all', { method: 'POST' });
      await fetchAssets();
    } catch (error) {
      console.error('同步失败:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncSingleAsset = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/${id}/sync`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setAssets((prev) =>
          prev.map((asset) => (asset.id === id ? data.data : asset))
        );
      }
    } catch (error) {
      console.error('同步失败:', error);
    }
  };

  const copyAssetId = async (assetId: string) => {
    try {
      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(assetId);
      } else {
        // 降级方案: 使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = assetId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('复制失败:', err);
          throw new Error('复制失败');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      setCopiedId(assetId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请手动复制');
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  // 执行删除
  const confirmDelete = async () => {
    if (!assetToDelete) return;
    
    const id = assetToDelete.id;
    setDeletingIds((prev) => new Set(prev).add(id));
    setDeleteDialogOpen(false);
    
    try {
      const response = await fetch(`/api/assets/${id}/delete`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        // 延迟移除，让动画有时间播放
        setTimeout(() => {
          setAssets((prev) => prev.filter((asset) => asset.id !== id));
          setDeletingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 300);
      } else {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (error) {
      console.error('删除失败:', error);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Calculate processing time
  useEffect(() => {
    const processingAssets = assets.filter(a => a.status === 'Processing');
    if (processingAssets.length === 0) {
      setProcessingTimes({});
      return;
    }

    const times: Record<string, number> = {};
    processingAssets.forEach(asset => {
      const createdAt = new Date(asset.created_at).getTime();
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      times[asset.id] = elapsed;
    });
    setProcessingTimes(times);

    const interval = setInterval(() => {
      setProcessingTimes(prev => {
        const updated: Record<string, number> = {};
        Object.keys(prev).forEach(id => {
          updated[id] = prev[id] + 1;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [assets]);

  // Auto-sync processing assets
  useEffect(() => {
    const hasProcessing = assets.some((a) => a.status === 'Processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      syncAllAssets();
    }, 10000);

    return () => clearInterval(interval);
  }, [assets.filter(a => a.status === 'Processing').length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProcessingPercentage = (seconds: number) => {
    return Math.min((seconds / 30) * 100, 95);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden"
      >
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-purple-500/20 to-transparent rotate-45 translate-x-14 -translate-y-14" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-xl font-bold neon-text">素材库</h2>
              <p className="text-xs text-muted-foreground">
                {assets.length} 个素材
                {assets.filter(a => a.status === 'Processing').length > 0 && (
                  <span className="text-cyan-400 ml-2">
                    · {assets.filter(a => a.status === 'Processing').length} 个处理中
                  </span>
                )}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={syncAllAssets}
            disabled={syncing}
            className="h-9 px-4 rounded-lg border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            同步
          </Button>
        </div>

        {/* Asset List */}
        {assets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center border border-dashed border-cyan-500/30">
              <Image className="w-8 h-8 text-cyan-400/50" />
            </div>
            <p className="text-muted-foreground mb-1">暂无素材</p>
            <p className="text-xs text-muted-foreground/50">上传你的第一个素材吧</p>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-3"
          >
            <AnimatePresence mode="popLayout">
              {assets.map((asset) => {
                const status = statusConfig[asset.status];
                const type = assetTypeConfig[asset.asset_type];
                const StatusIcon = status.icon;
                const TypeIcon = type.icon;
                const processingTime = processingTimes[asset.id] || 0;
                const isDeleting = deletingIds.has(asset.id);

                return (
                  <motion.div
                    key={asset.id}
                    variants={item}
                    exit="exit"
                    layout
                    className={`relative transition-opacity ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Type Icon */}
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                        >
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              {asset.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                            >
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {status.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-mono truncate max-w-[150px]">{asset.asset_id}</span>
                            <span>•</span>
                            <span>
                              {new Date(asset.created_at).toLocaleString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Processing Progress */}
                          {asset.status === 'Processing' && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
                                <Timer className="w-3 h-3" />
                                <span>已处理 {formatTime(processingTime)}</span>
                              </div>
                              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${getProcessingPercentage(processingTime)}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyAssetId(asset.asset_id);
                            }}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                            title="复制素材 ID"
                          >
                            {copiedId === asset.asset_id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(asset.url, '_blank');
                            }}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                            title="查看源文件"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </button>

                          {asset.status === 'Processing' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                syncSingleAsset(asset.id);
                              }}
                              disabled={isDeleting}
                              className="p-2 rounded-lg hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                              title="立即同步状态"
                            >
                              <RefreshCw className="w-4 h-4 text-slate-400" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(asset);
                            }}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="删除素材"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Decorative bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">确认删除</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              确定要删除素材 <span className="text-cyan-400 font-medium">「{assetToDelete?.name}」</span> 吗？
              <br />
              <span className="text-xs text-slate-500 mt-1 block">此操作无法撤销</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500/80 hover:bg-red-500 text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
