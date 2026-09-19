'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Globe, 
  Play, 
  Square, 
  Cpu, 
  Zap, 
  Activity, 
  ShieldAlert, 
  RotateCcw,
  Terminal,
  Settings
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('browser');

  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'أهلاً بك. يمكنك اختبار قوة تحمل موقعك أو طلب تعديل الكود في أي وقت.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [urlInput, setUrlInput] = useState('http://localhost:3000');
  const [currentUrl, setCurrentUrl] = useState('http://localhost:3000');
  const [generatedHtml, setGeneratedHtml] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: white; }
    .card { background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; text-align: center; }
    h1 { color: #38bdf8; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello World</h1>
    <p>Localhost Test Server Ready</p>
  </div>
</body>
</html>`);

  const [agentType, setAgentType] = useState('mobile'); 
  const [totalAgents, setTotalAgents] = useState(1000000); 
  const [concurrencyBatch, setConcurrencyBatch] = useState(100); 
  
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [sentRequests, setSentRequests] = useState(0);
  const [activeConnections, setActiveConnections] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [requestsPerSec, setRequestsPerSec] = useState(0);
  const [logs, setLogs] = useState([]);

  const isTestingRef = useRef(false);
  const requestsCounterRef = useRef(0);
  const rpsTimerRef = useRef(null);

  const addLog = (msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const runStressWorker = async (targetUrl) => {
    if (!isTestingRef.current) return;

    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Compatible; StressBot/2.0; +http://localhost)'
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    const startTime = performance.now();

    try {
      setActiveConnections((prev) => prev + 1);
      
      await fetch(targetUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        headers: { 'User-Agent': randomUA }
      });

      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration);
      setSuccessCount((prev) => prev + 1);

    } catch (err) {
      setErrorCount((prev) => prev + 1);
    } finally {
      setActiveConnections((prev) => Math.max(0, prev - 1));
      setSentRequests((prev) => {
        const next = prev + 1;
        requestsCounterRef.current += 1;
        
        if (next >= totalAgents) {
          stopTest();
          addLog(`اكتمل الاختبار! تم إرسال ${totalAgents.toLocaleString()} طلب بنجاح.`);
        }
        return next;
      });

      if (isTestingRef.current) {
        setTimeout(() => runStressWorker(targetUrl), 0);
      }
    }
  };

  const startTest = () => {
    if (!currentUrl) return;
    
    setIsRunningTest(true);
    isTestingRef.current = true;
    setSentRequests(0);
    setErrorCount(0);
    setSuccessCount(0);
    requestsCounterRef.current = 0;

    addLog(`بدء الضغط الفعلي على: ${currentUrl} بـ ${totalAgents.toLocaleString()} بوت...`);

    rpsTimerRef.current = setInterval(() => {
      setRequestsPerSec(requestsCounterRef.current);
      requestsCounterRef.current = 0;
    }, 1000);

    for (let i = 0; i < concurrencyBatch; i++) {
      runStressWorker(currentUrl);
    }
  };

  const stopTest = () => {
    setIsRunningTest(false);
    isTestingRef.current = false;
    if (rpsTimerRef.current) clearInterval(rpsTimerRef.current);
    addLog('تم إيقاف اختبار الضغط.');
  };

  const toggleTest = () => {
    if (isRunningTest) {
      stopTest();
    } else {
      startTest();
    }
  };

  const handleUrlSubmit = (e) => {
    e?.preventDefault();
    if (!urlInput.trim()) return;

    let target = urlInput.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    setCurrentUrl(target);
    addLog(`تم تغيير الهدف إلى: ${target}`);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: chatInput }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'استلمت الطلب، يمكنك بدء الضغط أو المعاينة من قسم المتصفح.' }
      ]);
    }, 500);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Cpu className="text-blue-500 w-6 h-6" />
            <span className="font-bold text-lg tracking-wide">DevStudio AI</span>
          </div>

          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('browser')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'browser'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>المتصفح واختبار الضغط</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>شات الذكاء الاصطناعي</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>Engine Status</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Ready
          </span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {activeTab === 'browser' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            <header className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap gap-3 items-center justify-between">
              
              <form onSubmit={handleUrlSubmit} className="flex-1 min-w-[300px] flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="ادخل رابط مثل example.com أو localhost:3000..."
                  className="bg-transparent border-none text-sm w-full focus:outline-none text-slate-200"
                />
                <button type="submit" className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded">
                  انتقال
                </button>
              </form>

              <div className="flex items-center gap-2">
                
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs">
                  <button
                    onClick={() => setAgentType('mobile')}
                    className={`px-2.5 py-1 rounded ${agentType === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    50 Mobile Agents
                  </button>
                  <button
                    onClick={() => setAgentType('ai-agent')}
                    className={`px-2.5 py-1 rounded ${agentType === 'ai-agent' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    AI Traffic
                  </button>
                </div>

                <select
                  value={totalAgents}
                  onChange={(e) => setTotalAgents(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value={1000}>1,000 Requests</option>
                  <option value={50000}>50,000 Requests</option>
                  <option value={1000000}>1,000,000 (1M Traffic)</option>
                </select>

                <select
                  value={concurrencyBatch}
                  onChange={(e) => setConcurrencyBatch(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value={20}>20 Concurrent Stress</option>
                  <option value={100}>100 High Stress</option>
                  <option value={300}>300 Ultra Blast</option>
                </select>

                <button
                  onClick={toggleTest}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isRunningTest
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isRunningTest ? <><Square className="w-3.5 h-3.5" /> إيقاف الضغط</> : <><Play className="w-3.5 h-3.5" /> بدء اختبار الضغط</>}
                </button>
              </div>
            </header>

            <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-2 grid grid-cols-5 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-slate-400">الطلبات الكلية</div>
                  <div className="font-mono font-bold text-slate-100">{sentRequests.toLocaleString()} / {totalAgents.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-slate-400">السرعة الحالية (RPS)</div>
                  <div className="font-mono font-bold text-blue-400">{requestsPerSec} req/sec</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-slate-400">زمن الاستجابة (Latency)</div>
                  <div className="font-mono font-bold text-slate-100">{latencyMs} ms</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-slate-400">فشل / أخطاء السيرفر</div>
                  <div className="font-mono font-bold text-rose-400">{errorCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-slate-400">نمط التنفيذ</div>
                  <div className="font-mono font-bold text-slate-100">Auto Sequential Kill</div>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden bg-slate-950">
              
              <div className="col-span-2 border-r border-slate-800 flex flex-col h-full">
                <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Target Preview Frame</span>
                  <span>{currentUrl}</span>
                </div>
                <div className="flex-1 bg-white relative">
                  {currentUrl.includes('localhost') ? (
                    <iframe
                      srcDoc={generatedHtml}
                      className="w-full h-full border-none"
                      title="Localhost Preview"
                    />
                  ) : (
                    <iframe
                      src={currentUrl}
                      className="w-full h-full border-none"
                      title="Direct Target Preview"
                    />
                  )}
                </div>
              </div>

              <div className="col-span-1 flex flex-col h-full bg-slate-950">
                
                <div className="flex-1 border-b border-slate-800 flex flex-col min-h-0">
                  <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" /> HTML / Source Code
                  </div>
                  <textarea
                    value={generatedHtml}
                    onChange={(e) => setGeneratedHtml(e.target.value)}
                    className="flex-1 bg-slate-950 text-emerald-400 font-mono text-xs p-3 resize-none focus:outline-none border-none leading-relaxed"
                  />
                </div>

                <div className="h-56 flex flex-col min-h-0 bg-slate-950">
                  <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" /> Traffic Console Logs
                  </div>
                  <div className="flex-1 p-2 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-1">
                    {logs.length === 0 ? (
                      <div className="text-slate-600 italic">اضغط "بدء اختبار الضغط" لبدء توليد الترافيك...</div>
                    ) : (
                      logs.map((log, index) => <div key={index}>{log}</div>)
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full bg-slate-950">
            <header className="bg-slate-900 border-b border-slate-800 p-4">
              <h2 className="text-sm font-semibold text-slate-200">محادثة الذكاء الاصطناعي العامة</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                إرسال
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
