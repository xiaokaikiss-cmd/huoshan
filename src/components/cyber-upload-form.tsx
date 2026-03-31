'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Sparkles, 
  Zap, 
  Image, 
  Video, 
  Music,
  ArrowRight,
  Rocket
} from 'lucide-react';
import { WorkflowProgress, WorkflowStatus } from './workflow-progress';

interface CyberUploadFormProps {
  onUploadSuccess: () => void;
}

const assetTypes = [
  { value: 'Image', label: '图片', icon: Image, color: 'from-cyan-500 to-blue-500' },
  { value: 'Video', label: '视频', icon: Video, color: 'from-purple-500 to-pink-500' },
  { value: 'Audio', label: '音频', icon: Music, color: 'from-green-500 to-emerald-500' },
] as const;

export function CyberUploadForm({ onUploadSuccess }: CyberUploadFormProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<'Image' | 'Video' | 'Audio'>('Image');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setWorkflowStatus('uploading');

    try {
      // Step 1: Upload
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, assetType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      // Step 2: Processing
      setWorkflowStatus('processing');

      // 轮询查询状态
      const assetId = data.data.id;
      let attempts = 0;
      const maxAttempts = 30; // 最多轮询 30 次（5分钟）

      const pollStatus = async () => {
        attempts++;
        
        const statusResponse = await fetch(`/api/assets/${assetId}/sync`, {
          method: 'POST',
        });
        const statusData = await statusResponse.json();

        if (statusData.success && statusData.data.status === 'Active') {
          setWorkflowStatus('success');
          setTimeout(() => {
            setUrl('');
            setName('');
            setWorkflowStatus('idle');
            onUploadSuccess();
          }, 2000);
          return;
        }

        if (statusData.success && statusData.data.status === 'Failed') {
          throw new Error('素材处理失败');
        }

        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 10000); // 每 10 秒查询一次
        } else {
          throw new Error('处理超时，请稍后在素材列表中查看状态');
        }
      };

      // 延迟 3 秒后开始轮询（给引擎一些处理时间）
      setTimeout(pollStatus, 3000);

    } catch (err) {
      setWorkflowStatus('failed');
      setErrorMessage(err instanceof Error ? err.message : '上传失败');
    }
  };

  const isProcessing = workflowStatus === 'uploading' || workflowStatus === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="cyber-card rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-cyan-500/20 to-transparent rotate-45 translate-x-14 -translate-y-14" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          className="relative"
          animate={isProcessing ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 20, repeat: isProcessing ? Infinity : 0, ease: 'linear' }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
            <Upload className="w-5 h-5 text-cyan-400" />
          </div>
        </motion.div>
        <div>
          <h2 className="text-xl font-bold neon-text">上传素材</h2>
          <p className="text-xs text-muted-foreground">Upload your assets</p>
        </div>
      </div>

      {/* Workflow Progress */}
      <AnimatePresence>
        {workflowStatus !== 'idle' && (
          <WorkflowProgress status={workflowStatus} errorMessage={errorMessage ?? undefined} />
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            素材 URL
          </Label>
          <div className="relative group">
            <Input
              type="url"
              placeholder="https://example.com/asset.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isProcessing}
              className="h-12 pl-4 rounded-xl text-sm"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-cyan-500/30" />
          </div>
        </motion.div>

        {/* Name Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            素材名称
          </Label>
          <div className="relative group">
            <Input
              type="text"
              placeholder="我的炫酷素材"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isProcessing}
              className="h-12 pl-4 rounded-xl text-sm"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-cyan-500/30" />
          </div>
        </motion.div>

        {/* Asset Type */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium">素材类型</Label>
          <div className="grid grid-cols-3 gap-2">
            {assetTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = assetType === type.value;
              return (
                <motion.button
                  key={type.value}
                  type="button"
                  onClick={() => setAssetType(type.value)}
                  disabled={isProcessing}
                  className={`
                    relative p-3 rounded-xl border transition-all duration-300
                    ${isSelected 
                      ? 'border-cyan-500/50 bg-cyan-500/10' 
                      : 'border-border/50 bg-background/30 hover:border-cyan-500/30'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  whileHover={isProcessing ? {} : { scale: 1.02 }}
                  whileTap={isProcessing ? {} : { scale: 0.98 }}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${type.color} bg-opacity-20`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{type.label}</span>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="selectedType"
                      className="absolute inset-0 rounded-xl border border-cyan-400"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 border border-muted-foreground/10"
        >
          <p className="font-medium mb-1">处理流程：</p>
          <ol className="space-y-0.5 text-muted-foreground/70">
            <li>1. 上传素材到火山引擎</li>
            <li>2. 引擎后台处理（约 5-30 秒）</li>
            <li>3. 自动激活，可立即使用</li>
          </ol>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full h-12 cyber-button rounded-xl font-semibold text-sm relative overflow-hidden group text-white"
          >
            {workflowStatus === 'success' ? (
              <div className="flex items-center gap-2 text-green-400">
                <Rocket className="w-4 h-4" />
                <span>上传成功！</span>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-2 text-white">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>处理中，请稍候...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white">
                <span>立即上传</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
        </motion.div>
      </form>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </motion.div>
  );
}
