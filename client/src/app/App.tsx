import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Sparkles, AlertCircle, TrendingUp, X, Check } from 'lucide-react';
import { AnimatedIcon } from './components/AnimatedIcon';

interface AnalysisResult {
  category: string;
  keyIssues: string[];
  summary: string;
}

type AppState = 'initial' | 'input' | 'analyzing' | 'results';

type LoadingStage = {
  label: string;
  completed: boolean;
  progress: number;
};

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:3001');

export default function App() {
  const [appState, setAppState] = useState<AppState>('initial');
  const [complaintText, setComplaintText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>([
    { label: 'Key issue extraction', completed: false, progress: 0 },
    { label: 'Category classification', completed: false, progress: 0 },
    { label: 'Summary generation', completed: false, progress: 0 },
  ]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = () => {
    setAppState('input');
  };

  const handleAnalyze = async () => {
    if (!complaintText.trim()) {
      setErrorMessage('Complaint text is required.');
      return;
    }

    setAppState('analyzing');
    setErrorMessage(null);

    setLoadingStages([
      { label: 'Key issue extraction', completed: false, progress: 0 },
      { label: 'Category classification', completed: false, progress: 0 },
      { label: 'Summary generation', completed: false, progress: 0 },
    ]);

    const runProgressSequence = async () => {
      const delays = [900, 900, 900];
      for (let i = 0; i < delays.length; i += 1) {
        const duration = delays[i];
        const steps = 20;
        const stepDuration = duration / steps;

        for (let step = 0; step <= steps; step += 1) {
          const progress = (step / steps) * 100;
          await new Promise((resolve) => setTimeout(resolve, stepDuration));
          setLoadingStages((prev) =>
            prev.map((stage, idx) => (idx === i ? { ...stage, progress } : stage))
          );
        }

        setLoadingStages((prev) =>
          prev.map((stage, idx) =>
            idx === i ? { ...stage, completed: true, progress: 100 } : stage
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    };

    try {
      const progressPromise = runProgressSequence();
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: complaintText.trim(),
          imageBase64: uploadedImage,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Analysis failed. Please try again.');
      }

      const result = (await response.json()) as AnalysisResult;
      await progressPromise;
      setAnalysisResult(result);
      setAppState('results');
    } catch (error) {
      setAppState('input');
      setErrorMessage(error instanceof Error ? error.message : 'Analysis failed.');
    }
  };

  const handleReset = () => {
    setComplaintText('');
    setUploadedImage(null);
    setAnalysisResult(null);
    setAppState('initial');
    setErrorMessage(null);
  };

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl min-h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Financial Complaint Analyzer
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Multi-modal AI-powered complaint analysis and categorization
          </p>
        </motion.div>

        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {appState === 'initial' && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center max-w-2xl w-full"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 shadow-2xl">
                  <div className="mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30 mx-auto mb-6 flex items-center justify-center">
                      <AnimatedIcon />
                    </div>
                    <h2 className="text-3xl mb-4">Ready to Analyze Your Complaint</h2>
                    <p className="text-slate-400 text-lg">
                      Our AI-powered system will help you categorize and understand your financial complaint
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startAnalysis}
                    className="py-4 px-12 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Analysis
                  </motion.button>
                </div>
              </motion.div>
            )}

            {appState === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-3xl"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <h2 className="text-2xl mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-400" />
                    <span>Enter Your Complaint Details</span>
                  </h2>

                  <div className="mb-6">
                    <label className="block mb-3 text-sm text-slate-300">Complaint Description</label>
                    {errorMessage && (
                      <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        <AlertCircle className="mt-0.5 h-4 w-4" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                    <textarea
                      value={complaintText}
                      onChange={(e) => setComplaintText(e.target.value)}
                      placeholder="Describe your financial complaint in detail..."
                      className="w-full h-48 px-4 py-3 rounded-2xl bg-slate-900/50 border border-slate-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-100 placeholder-slate-500 resize-none transition-all duration-300"
                    />
                  </div>

                  <div className="mb-8">
                    <label className="block mb-3 text-sm text-slate-300">
                      Upload Supporting Document (Optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {!uploadedImage ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-700/50 hover:border-blue-500/50 bg-slate-900/30 hover:bg-slate-900/50 transition-all duration-300 flex flex-col items-center justify-center gap-2 group"
                      >
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        <span className="text-slate-400 group-hover:text-blue-400 transition-colors">
                          Click to upload image
                        </span>
                      </button>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 group">
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-48 object-cover" />
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-red-500/80 hover:bg-red-500 backdrop-blur-sm transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyze}
                      disabled={!complaintText.trim()}
                      className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Analyze Complaint
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReset}
                      className="py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {appState === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-2xl"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 shadow-2xl">
                  <h2 className="text-2xl mb-8 text-center">Processing Your Complaint</h2>

                  <div className="space-y-4">
                    {loadingStages.map((stage, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl bg-slate-900/50 border border-slate-700/50 overflow-hidden"
                      >
                        <div className="flex items-center gap-4 p-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                              stage.completed
                                ? 'bg-blue-500 border-2 border-blue-400'
                                : stage.progress > 0
                                ? 'bg-blue-600/50 border-2 border-blue-500/50'
                                : 'bg-slate-800 border-2 border-slate-700'
                            }`}
                          >
                            {stage.completed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                              >
                                <Check className="w-5 h-5 text-white" />
                              </motion.div>
                            )}
                            {!stage.completed && stage.progress > 0 && (
                              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`text-lg transition-colors block ${
                                stage.completed
                                  ? 'text-blue-300'
                                  : stage.progress > 0
                                  ? 'text-slate-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {stage.label}
                            </span>
                            {!stage.completed && stage.progress > 0 && (
                              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${stage.progress}%` }}
                                  transition={{ duration: 0.1, ease: 'linear' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {appState === 'results' && analysisResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                      <span>Analysis Results</span>
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                      className="py-2 px-6 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 transition-all duration-300"
                    >
                      New Analysis
                    </motion.button>
                  </div>

                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block mb-2 text-sm text-slate-400">Category</label>
                      <div className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur-sm">
                        <p className="text-xl text-blue-300">{analysisResult.category}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block mb-3 text-sm text-slate-400">Key Issues Identified</label>
                      <div className="space-y-3">
                        {analysisResult.keyIssues.map((issue, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="flex items-start gap-3 px-4 py-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 hover:border-blue-500/30 transition-all group"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-slate-300">{issue}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <label className="block mb-3 text-sm text-slate-400">Executive Summary</label>
                      <div className="px-6 py-5 rounded-xl bg-slate-900/50 border border-slate-700/50">
                        <p className="text-slate-300 leading-relaxed">{analysisResult.summary}</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-slate-500 text-sm"
        >
          <p>Powered by AI • Secure & Confidential Analysis</p>
        </motion.div>
      </div>
    </div>
  );
}
