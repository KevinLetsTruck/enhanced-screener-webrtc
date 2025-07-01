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
                onChange={(e) => setSettings(prev => ({ ...prev, screenerName: e.target.value }))}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
          </div>
          <button 
            onClick={initializeWebRTC}
            className="mt-4 px-4 py-2 bg-blue-600 rounded"
          >
            🔄 Reconnect to WebRTC
          </button>
        </div>
      )}

      {/* Active Screening Sessions */}
      {activeCalls.length > 0 && (
        <div className="bg-green-900 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-bold mb-4 text-green-100">
            🔴 Active Screening Sessions ({activeCalls.length})
          </h3>
          {activeCalls.map(call => (
            <div key={call.id} className="flex justify-between items-center p-3 bg-green-800 rounded mb-2">
              <div>
                <h4 className="font-bold text-green-100">{call.name}</h4>
                <p className="text-sm text-green-200">{call.topic}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-200">
                  Duration: {Math.floor((new Date() - call.startTime) / 1000)}s
                </span>
                <button
                  onClick={() => endScreening(call.id)}
                  className="px-3 py-1 bg-red-600 rounded text-sm"
                >
                  📞 End
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Caller Form */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">➕ Add New Caller</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Caller Name *</label>
                <input
                  type="text"
                  value={newCaller.name}
                  onChange={(e) => setNewCaller(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="Enter caller's name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCaller.phone}
                  onChange={(e) => setNewCaller(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={newCaller.location}
                  onChange={(e) => setNewCaller(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="City, State"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={newCaller.priority}
                  onChange={(e) => setNewCaller(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Topic *</label>
              <input
                type="text"
                value={newCaller.topic}
                onChange={(e) => setNewCaller(prev => ({ ...prev, topic: e.target.value }))}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="What does the caller want to discuss?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Screening Notes</label>
              <textarea
                value={newCaller.notes}
                onChange={(e) => setNewCaller(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-2 rounded bg-gray-700 text-white h-20"
                placeholder="Key details about the caller's situation..."
              />
            </div>
            
            <button 
              onClick={addCaller}
              className="w-full py-2 bg-blue-600 rounded font-medium"
            >
              ➕ Add Caller to Queue
            </button>
          </div>
        </div>

        {/* Caller Queue */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Caller Queue ({callers.length})</h2>
            <button 
              onClick={fetchCallers}
              className="px-3 py-1 bg-gray-700 rounded text-sm"
            >
              🔄 Refresh
            </button>
          </div>
          
          {callers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No callers in queue</p>
              <p className="text-sm text-gray-500">Add callers using the form on the left</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {callers.map(caller => (
                <div key={caller.id} className={`p-4 rounded-lg ${caller.priority === 'high' ? 'bg-red-900 border border-red-500' : 'bg-gray-700'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">{caller.name}</h3>
                      <p className="text-sm text-gray-300">{caller.phone} • {caller.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${caller.priority === 'high' ? 'bg-red-600' : 'bg-gray-600'}`}>
                        {caller.priority}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-2"><strong>Topic:</strong> {caller.topic}</p>
                  {caller.notes && <p className="text-sm mb-2"><strong>Notes:</strong> {caller.notes}</p>}
                  
                  <div className="flex gap-2 mt-3">
                    {!activeCalls.some(ac => ac.id === caller.id) ? (
                      <button
                        onClick={() => startScreening(caller)}
                        className="px-3 py-1 bg-green-600 rounded text-sm"
                      >
                        📞 Start Screening
                      </button>
                    ) : (
                      <button
                        onClick={() => endScreening(caller.id)}
                        className="px-3 py-1 bg-red-600 rounded text-sm"
                      >
                        📞 End Screening
                      </button>
                    )}
                    
                    <button
                      onClick={() => uploadDocument(caller.id)}
                      className="px-3 py-1 bg-blue-600 rounded text-sm"
                    >
                      📄 Upload Doc
                    </button>
                    
                    <button
                      onClick={() => sendToHost(caller)}
                      className="px-3 py-1 bg-purple-600 rounded text-sm"
                    >
                      Send to Host
                    </button>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Added: {new Date(caller.joinTime).toLocaleTimeString()}</span>
                    <span>Screener: {caller.screenerName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gray-800 p-4 rounded-lg mt-6">
        <h3 className="text-lg font-bold mb-4">✅ System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">WebRTC Status:</p>
            <p className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
              {connectionStatus}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Last Sync:</p>
            <p>{lastSync || 'Never'}</p>
          </div>
          <div>
            <p className="text-gray-400">Active Calls:</p>
            <p>{activeCalls.length}</p>
          </div>
          <div>
            <p className="text-gray-400">Queue Length:</p>
            <p>{callers.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<EnhancedScreenerApp />, document.getElementById('root'));
