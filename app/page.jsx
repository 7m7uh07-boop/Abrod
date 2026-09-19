'use client';

import { useState, useRef } from 'react';
import { 
  MessageSquare, 
  Globe, 
  Play, 
  Square, 
  Cpu, 
  Zap, 
  Activity, 
  ShieldAlert, 
  Terminal,
  Settings,
  Code
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('browser');

  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'مرحباً بك! يمكنك استخدام الأدوات لاختبار السيرفرات والضغط.' }
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
  const [latencyMs, setLatencyMs] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [requestsPerSec, setRequestsPerSec] = useState(0);
  const [logs, setLogs] = useState([]);

  const isTestingRef = useRef(false);
  const requestsCounterRef = useRef(0);
  const rpsTimerRef = useRef(null);

  const addLog = (msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 29)]);
  };

  const runStressWorker = async (targetUrl) => {
    if (!isTestingRef.current) return;

    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/120.0.0.0',
      'Mozilla/5.0 (Compatible; StressBot/2.0)'
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    const startTime = performance.now();

    try {
      await fetch(targetUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        headers: { 'User-Agent': randomUA }
      });

      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration);

    } catch (err) {
      setErrorCount((prev) => prev + 1);
    } finally {
      setSentRequests((prev) => {
        const next = prev + 1;
        requestsCounterRef.current += 1;
        
        if (next >= totalAgents) {
          stopTest();
          addLog(`اكتمل الاختبار! تم إرسال ${totalAgents.toLocaleString()} طلب.`);
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
    requestsCounterRef.current = 0;

    addLog(`بدء الضغط على: ${currentUrl}`);

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
        { role: 'assistant', content: 'تم استقبال رسالتك بنجاح.' }
      ]);
    }, 500);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col justify-between shrink-0 p-3">
        <div className="flex md:flex-col items-center md:items-stretch w-full justify-between gap-2">
          <div className="flex items-center gap-2 p-1 font-bold text-base md:text-lg">
            <Cpu className="text-blue-500 w-5 h-5 shrink-0" />
            <span>DevStudio AI</span>
          </div>

          <div className="flex md:flex-col gap-1">
            <button
              onClick={() => setActiveTab('browser')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                activeTab === 'browser' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>المتصفح والأدوات</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>الدردشة</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {activeTab === 'browser' && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto md:overflow-hidden">
            
            {/* Control Bar */}
            <header className="bg-slate-900 border-b border-slate-800 p-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shrink-0">
              
              <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="http://localhost:3000 أو رابط الموقع..."
                  className="bg-transparent border-none text-xs md:text-sm w-full focus:outline-none text-slate-200"
                />
                <button type="submit" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded">
                  دخول
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value="mobile">Mobile Agents</option>
                  <option value="ai-agent">AI Traffic</option>
                </select>

                <select
                  value={totalAgents}
                  onChange={(e) => setTotalAgents(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value={1000}>1,000 req</option>
                  <option value={50000}>50,000 req</option>
                  <option value={1000000}>1,000,000 req</option>
                </select>

                <select
                  value={concurrencyBatch}
                  onChange={(e) => setConcurrencyBatch(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value={20}>20 Concurrency</option>
                  <option value={100}>100 Concurrency</option>
                  <option value={300}>300 Concurrency</option>
                </select>

                <button
                  onClick={toggleTest}
                  className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isRunningTest ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isRunningTest ? <><Square className="w-3.5 h-3.5" /> إيقاف</> : <><Play className="w-3.5 h-3.5" /> بدء الضغط</>}
                </button>
              </div>
            </header>

            {/* Metrics Status Bar */}
            <div className="bg-slate-900/60 border-b border-slate-800 p-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-slate-500 text-[10px]">الطلبات</div>
                  <div className="font-mono font-bold truncate">{sentRequests.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-slate-500 text-[10px]">السرعة (RPS)</div>
                  <div className="font-mono font-bold text-blue-400 truncate">{requestsPerSec} req/s</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-slate-500 text-[10px]">الاستجابة</div>
                  <div className="font-mono font-bold truncate">{latencyMs} ms</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-slate-500 text-[10px]">الأخطاء</div>
                  <div className="font-mono font-bold text-rose-400 truncate">{errorCount}</div>
                </div>
              </div>
            </div>

            {/* Workspace Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
              
              {/* Preview Box */}
              <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col h-64 lg:h-full">
                <div className="bg-slate-900 px-3 py-1 border-b border-slate-800 text-[11px] text-slate-400 flex justify-between items-center shrink-0">
                  <span>المعاينة المباشرة (Preview)</span>
                  <span className="truncate max-w-[200px]">{currentUrl}</span>
                </div>
                <div className="flex-1 bg-white relative">
                  {currentUrl.includes('localhost') ? (
                    <iframe
                      srcDoc={generatedHtml}
                      className="w-full h-full border-none"
                      title="Preview"
                    />
                  ) : (
                    <iframe
                      src={currentUrl}
                      className="w-full h-full border-none"
                      title="Target Preview"
                    />
                  )}
                </div>
              </div>

              {/* Code & Logs Panel */}
              <div className="lg:col-span-1 flex flex-col h-full bg-slate-950">
                
                {/* HTML Source */}
                <div className="flex-1 border-b border-slate-800 flex flex-col min-h-[150px]">
                  <div className="bg-slate-900 px-3 py-1 border-b border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Code className="w-3.5 h-3.5" /> HTML Source
                  </div>
                  <textarea
                    value={generatedHtml}
                    onChange={(e) => setGeneratedHtml(e.target.value)}
                    className="flex-1 bg-slate-950 text-emerald-400 font-mono text-xs p-2 resize-none focus:outline-none border-none"
                  />
                </div>

                {/* Console Logs */}
                <div className="h-40 flex flex-col shrink-0 bg-slate-950">
                  <div className="bg-slate-900 px-3 py-1 border-b border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Terminal className="w-3.5 h-3.5" /> Terminal Logs
                  </div>
                  <div className="flex-1 p-2 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1">
                    {logs.length === 0 ? (
                      <div className="text-slate-600 italic">السجل فارغ حالياً...</div>
                    ) : (
                      logs.map((log, index) => <div key={index}>{log}</div>)
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full bg-slate-950">
            <header className="bg-slate-900 border-b border-slate-800 p-3">
              <h2 className="text-xs font-semibold text-slate-300">الدردشة والتعليمات</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-xs md:text-sm leading-relaxed ${
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

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition"
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
