import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Sparkles, 
  History, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Check,
  Plus,
  X
} from 'lucide-react';
import { MBTI_TYPES, MBTIType } from './constants';
import { generateMBTIAvatar } from './lib/gemini';

interface UserPhoto {
  base64: string;
  name: string;
}

interface GeneratedAvatar {
  id: string;
  url: string;
  mbti: string;
  prompt: string;
  timestamp: number;
  originalName?: string;
}

export default function App() {
  const [selectedType, setSelectedType] = useState<MBTIType | null>(null);
  const [prompt, setPrompt] = useState('');
  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedAvatar[]>([]);
  const [exportSize, setExportSize] = useState<'512' | '1024' | '2048'>('1024');
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mbti_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbti_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [history]);

  const handleGenerate = async () => {
    if (!selectedType) return;
    if (userPhotos.length === 0 && !prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const localImageUrl = `/avatars/${selectedType.id}.webp`;
      const response = await fetch(localImageUrl);
      if (!response.ok) throw new Error(`无法加载原素材图片: ${selectedType.id}.webp`);
      
      const blob = (await response.blob()) as any;
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsDataURL(blob);
      });

      // Batch processing logic
      if (userPhotos.length > 0) {
        setBatchProgress({ current: 0, total: userPhotos.length });
        
        for (let i = 0; i < userPhotos.length; i++) {
          // Add a small delay between requests to avoid rate limits
          if (i > 0) await new Promise(resolve => setTimeout(resolve, 2000));
          
          setBatchProgress({ current: i + 1, total: userPhotos.length });
          const generatedUrl = await generateMBTIAvatar(selectedType.id, prompt, base64Image, userPhotos[i].base64);
          
          const newAvatar: GeneratedAvatar = {
            id: Date.now().toString() + i,
            url: generatedUrl,
            mbti: selectedType.id,
            prompt: prompt || `批量生成 #${i + 1}`,
            timestamp: Date.now(),
            originalName: userPhotos[i].name
          };
          
          setHistory(prev => [newAvatar, ...prev]);
          if (i === userPhotos.length - 1) setCurrentImage(generatedUrl);
        }
      } else {
        // Single prompt-only generation
        const generatedUrl = await generateMBTIAvatar(selectedType.id, prompt, base64Image);
        setCurrentImage(generatedUrl);
        const newAvatar: GeneratedAvatar = {
          id: Date.now().toString(),
          url: generatedUrl,
          mbti: selectedType.id,
          prompt: prompt || '默认风格',
          timestamp: Date.now(),
        };
        setHistory(prev => [newAvatar, ...prev]);
      }
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : '生成失败，请检查网络或 API Key 设置。');
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };

  const downloadImage = (url: string | null, avatar: Partial<GeneratedAvatar>) => {
    if (!url) return;
    const size = parseInt(exportSize);
    const filename = avatar.originalName ? `${avatar.originalName}.png` : `mbti-${avatar.mbti || 'avatar'}-${avatar.id || Date.now()}.png`;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          const resizedUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = resizedUrl;
          link.download = `${filename}_${size}px.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (e) {
        console.error("Download failed", e);
        setError("图片下载失败，请尝试右键另存为");
      }
    };
    img.onerror = () => {
      setError("图片加载失败，无法下载");
    };
    img.src = url;
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList: File[] = Array.from(files);
      fileList.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
          setUserPhotos(prev => [...prev, { base64, name: fileName }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setUserPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-purple-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            MBTI 小人生成器
          </h1>
        </div>
        
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
        >
          <History className="w-6 h-6 text-gray-600" />
          {history.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
              {history.length}
            </span>
          )}
        </button>
      </header>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
          >
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">第一步：选择 MBTI 类型</h2>
            <div className="grid grid-cols-4 gap-3">
              {MBTI_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={`
                    relative group flex flex-col items-center p-3 rounded-2xl transition-all duration-300
                    ${selectedType?.id === type.id 
                      ? 'bg-white shadow-xl shadow-gray-200 ring-2 ring-indigo-500 scale-105' 
                      : 'bg-white hover:bg-gray-50 border border-gray-100'}
                  `}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden mb-2 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-indigo-200 transition-colors">
                    <img 
                      src={`/avatars/${type.id}.webp`} 
                      alt={type.id} 
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className={`text-[10px] font-bold transition-colors ${selectedType?.id === type.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {type.id}
                  </span>
                  {selectedType?.id === type.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">第二步：选择创作方式（二选一或结合）</h2>
            <div className="space-y-6">
              {/* Photo Upload */}
              <div className="relative group">
                <div className="text-[11px] font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> 方式 A：上传照片（图生图）
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <div className="space-y-3">
                  <label
                    htmlFor="photo-upload"
                    className="w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-gray-50 transition-all"
                  >
                    <Plus className="w-6 h-6 text-gray-300 mb-1" />
                    <span className="text-xs text-gray-500 font-medium">添加照片</span>
                    <span className="text-[10px] text-gray-400">支持多选，批量生成</span>
                  </label>

                  {userPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {userPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square group">
                          <img 
                            src={`data:image/png;base64,${photo.base64}`} 
                            alt={`Upload ${idx}`} 
                            className="w-full h-full object-cover rounded-lg border border-gray-100"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[8px] truncate px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {photo.name}
                          </div>
                          <button 
                            onClick={() => removePhoto(idx)}
                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="relative">
                <div className="text-[11px] font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> 方式 B：输入描述（文生图）
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例如：穿着宇航服，手里拿着一本书..."
                  className="w-full h-24 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-gray-700 placeholder:text-gray-300"
                />
              </div>
            </div>
          </section>

          <button
            onClick={handleGenerate}
            disabled={!selectedType || (!prompt.trim() && userPhotos.length === 0) || isGenerating}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg flex flex-col items-center justify-center gap-1 transition-all
              ${!selectedType || (!prompt.trim() && userPhotos.length === 0) || isGenerating 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]'}
            `}
          >
            <div className="flex items-center gap-3">
              {isGenerating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
              <span>{isGenerating ? '正在创作中...' : userPhotos.length > 1 ? `批量生成 (${userPhotos.length}张)` : '生成我的 MBTI 小人'}</span>
            </div>
            {batchProgress && (
              <span className="text-[10px] opacity-80 font-normal">
                进度: {batchProgress.current} / {batchProgress.total}
              </span>
            )}
          </button>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {currentImage ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center gap-8 w-full"
                >
                  <div className="relative group">
                    <img 
                      src={currentImage} 
                      alt="Generated MBTI Avatar" 
                      className="w-full max-w-[400px] rounded-2xl shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 w-full">
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                      {(['512', '1024', '2048'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setExportSize(size)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${exportSize === size ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => downloadImage(currentImage, history.find(h => h.url === currentImage) || { id: 'current', url: currentImage, mbti: selectedType?.id || 'unknown', prompt: prompt, timestamp: Date.now() })}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                      <Download className="w-5 h-5" />
                      下载 PNG
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <ImageIcon className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-medium">在左侧选择类型并输入提示词，<br />开启你的 MBTI 创作之旅</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Decorative background elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
          </div>
        </div>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-6 h-6 text-indigo-500" />
                  历史记录
                </h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ImageIcon className="w-12 h-12 opacity-20" />
                    <p>暂无历史记录</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="group relative bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 transition-all">
                      <div className="flex gap-4">
                        <img 
                          src={item.url} 
                          alt={item.mbti} 
                          className="w-24 h-24 rounded-xl object-cover shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-600 rounded-md text-[10px] font-bold mb-2">
                              {item.mbti}
                            </span>
                            <button 
                              onClick={() => deleteFromHistory(item.id)}
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{item.prompt}</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setCurrentImage(item.url)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline"
                            >
                              查看详情
                            </button>
                            <button 
                              onClick={() => downloadImage(item.url, item)}
                              className="text-[10px] font-bold text-gray-500 hover:underline"
                            >
                              下载
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {history.length > 0 && (
                <div className="p-6 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      if(window.confirm('确定要清空所有历史记录吗？')) setHistory([]);
                    }}
                    className="w-full py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    清空历史
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-400">
          基于 Google Gemini AI 技术驱动 • 16personalities 风格致敬
        </p>
      </footer>
    </div>
  );
}
