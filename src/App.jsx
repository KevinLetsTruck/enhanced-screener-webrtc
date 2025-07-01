const { useState, useEffect, useRef } = React;

const EnhancedScreenerApp = () => {
  const [callers, setCallers] = useState([]);
  const [activeCalls, setActiveCalls] = useState([]);
  const [newCaller, setNewCaller] = useState({
    name: '',
    phone: '',
    location: '',
    topic: '',
    notes: '',
    priority: 'medium'
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastSync, setLastSync] = useState('');
  const [settings, setSettings] = useState({
    screenerName: 'Angie',
    webrtcServer: 'api.audioroad-live.com:8080',
    showSettings: false
  });

  useEffect(() => {
    initializeWebRTC();
    fetchCallers();
    
    const syncInterval = setInterval(fetchCallers, 10000);
    return () => clearInterval(syncInterval);
  }, []);

  const initializeWebRTC = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch(`http://${settings.webrtcServer}/health`);
      if (response.ok) {
        setConnectionStatus('connected');
        console.log('WebRTC server connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Failed to connect to WebRTC server:', error);
      setConnectionStatus('error');
    }
  };

  const fetchCallers = async () => {
    try {
      const response = await fetch(`http://${settings.webrtcServer}/api/callers`);
      if (response.ok) {
        const data = await response.json();
        setCallers(data);
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch callers:', error);
    }
  };

  const addCaller = async () => {
    if (!newCaller.name || !newCaller.topic) {
      alert('Please fill in caller name and topic');
      return;
    }

    const callerData = {
      ...newCaller,
      id: `caller_${Date.now()}`,
      status: 'screening',
      joinTime: new Date().toISOString(),
      screenerName: settings.screenerName
    };

    console.log('Adding caller:', callerData);
    setCallers(prev => [...prev, callerData]);
    setNewCaller({
      name: '',
      phone: '',
      location: '',
      topic: '',
      notes: '',
      priority: 'medium'
    });
  };

  const sendToHost = (caller) => {
    console.log(`Sending ${caller.name} to host`);
    alert(`${caller.name} sent to host dashboard!`);
  };

  const startScreening = (caller) => {
    setActiveCalls(prev => [...prev, { ...caller, startTime: new Date() }]);
    console.log(`Started screening with ${caller.name}`);
  };

  const endScreening = (callerId) => {
    setActiveCalls(prev => prev.filter(c => c.id !== callerId));
    console.log(`Ended screening for caller ${callerId}`);
  };

  const uploadDocument = (callerId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.png,.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log(`Uploading document for caller ${callerId}:`, file.name);
        alert(`Document "${file.name}" uploaded for analysis!`);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🎧 Enhanced Screener Dashboard
          </h1>
          <p className="text-gray-300">Screener: {settings.screenerName} | WebRTC Integration</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm capitalize">{connectionStatus}</span>
          </div>
          
          <button 
            onClick={() => setSettings(prev => ({ ...prev, showSettings: !prev.showSettings }))}
            className="px-3 py-1 bg-gray-700 rounded text-sm"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {settings.showSettings && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-bold mb-4">WebRTC Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">WebRTC Server:</label>
              <input
                type="text"
                value={settings.webrtcServer}
                onChange={(e) => setSettings(prev => ({ ...prev, webrtcServer: e.target.value }))}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Screener Name:</label>
              <input
                type="text"
                value={settings.screenerName}
                onChange={(e) => setSettings(prev
