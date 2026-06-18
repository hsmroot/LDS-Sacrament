import React, { useState, useEffect } from 'react';

// ==========================================
// 1. DYNAMIC DATE HELPER
// ==========================================
const getUpcomingSundays = () => {
  const sundays = [];
  const date = new Date();
  
  date.setDate(date.getDate() + ((7 - date.getDay()) % 7)); 
  
  for (let i = 0; i < 4; i++) {
    sundays.push(new Date(date).toISOString().split('T')[0]);
    date.setDate(date.getDate() + 7); 
  }
  return sundays;
};

// ==========================================
// 2. MAIN APP COMPONENT
// ==========================================
export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState('roster');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const upcomingSundays = getUpcomingSundays();
  const [selectedDate, setSelectedDate] = useState(upcomingSundays[0]);

  const [leadership, setLeadership] = useState({
    bishop: { name: 'Bishop Clarke', email: 'bishop@ward.org', phone: '555-0001' },
    clerk: { name: 'Ryan', email: 'clerk@ward.org', phone: '555-0002' },
    coord1: { name: 'Moroni', email: 'moroni@ward.org', phone: '555-0003' },
    coord2: { name: 'Hari', email: 'hari@ward.org', phone: '555-0004' }
  });

  const [selectedCoordinatorKey, setSelectedCoordinatorKey] = useState('');
  const [deliverers, setDeliverers] = useState([
    { name: '', email: '' },
    { name: '', email: '' },
    { name: '', email: '' },
    { name: '', email: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // --- Effects ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.onload = () => {
      window.tailwind.config = { darkMode: 'class' };
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setSelectedCoordinatorKey('');
    setDeliverers([{ name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }]);
    setStatusMessage(null);
  }, [selectedDate]);

  // --- Handlers ---
  const handleLeadershipChange = (role, field, value) => {
    setLeadership(prev => ({ ...prev, [role]: { ...prev[role], [field]: value } }));
  };

  const handleDelivererChange = (index, field, value) => {
    const updated = [...deliverers];
    updated[index][field] = value;
    setDeliverers(updated);
  };

  const addDelivererSlot = () => setDeliverers([...deliverers, { name: '', email: '' }]);
  
  const removeDelivererSlot = (index) => {
    if (deliverers.length <= 4) return;
    setDeliverers(deliverers.filter((_, i) => i !== index));
  };

  const handleSaveAndSend = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    // 🛑 PASTE YOUR ZAPIER OR MAKE.COM WEBHOOK URL HERE 🛑
    const WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/YOUR_URL_HERE";

    const validDeliverers = deliverers.filter(d => d.name.trim() !== '' || d.email.trim() !== '');
    const activeCoordinator = leadership[selectedCoordinatorKey];

    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
    const wardInfo = "YSA 2nd Ward (Takapuna)";

    const emailsToSend = [];

    // 1. Deliverer Emails
    validDeliverers.forEach(deliverer => {
      if (deliverer.email) {
        emailsToSend.push({
          to: deliverer.email,
          cc: "",
          subject: `Sacrament Assignment: ${wardInfo} - ${formattedDate}`,
          body: `Dear ${deliverer.name || 'Brother'},\n\nYou have been assigned to deliver the sacrament this coming Sunday, ${formattedDate}, for the ${wardInfo}.\n\n*** Please ensure you are seated and available at least 15 minutes before the beginning of the sacrament. ***\n\nIf you have any questions or need to arrange a substitute, please contact your sacrament coordinator, ${activeCoordinator?.name || 'your coordinator'}, at ${activeCoordinator?.phone || 'N/A'} or ${activeCoordinator?.email || 'N/A'}.\n\nThank you for your service!`
        });
      }
    });

    // 2. Bishopric Email
    const delivererListText = validDeliverers.map((d, i) => `  ${i + 1}. ${d.name || 'Unknown'} - ${d.email || 'No Email'}`).join('\n');
    emailsToSend.push({
      to: leadership.bishop.email,
      cc: leadership.clerk.email,
      subject: `Roster Finalized: ${wardInfo} Sacrament - ${formattedDate}`,
      body: `Dear ${leadership.bishop.name} & ${leadership.clerk.name},\n\nThe sacrament delivery roster for the ${wardInfo} on ${formattedDate} has been finalized.\n\nCoordinator in Charge: ${activeCoordinator?.name || 'None Assigned'}\n\nAssigned Deliverers:\n${delivererListText}\n\nNotifications and instructions to arrive 15 minutes early have already been sent to the deliverers.`
    });

    // 3. Coordinator Email
    if (activeCoordinator?.email) {
      emailsToSend.push({
        to: activeCoordinator.email,
        cc: "",
        subject: `Confirmation: Roster Dispatched - ${formattedDate}`,
        body: `Dear ${activeCoordinator.name},\n\nThank you for organizing the roster. The sacrament assignments for the ${wardInfo} have been successfully dispatched to your deliverers, and the Bishopric has been notified.`
      });
    }

    try {
      if (WEBHOOK_URL.includes("YOUR_URL_HERE")) {
        console.log("Emails generated successfully! Add your webhook URL to send them for real.");
        console.log(emailsToSend);
        setStatusMessage('Success! (Simulated - Add Webhook URL to send real emails)');
      } else {
        for (const emailData of emailsToSend) {
          await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
          });
        }
        setStatusMessage('Success! Real emails were dispatched via your automation.');
      }
    } catch (error) {
      console.error("Webhook failed:", error);
      setStatusMessage('Error: Failed to connect to the automation webhook.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Views ---
  const renderSettings = () => (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fadeIn transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Leadership & Contacts</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update the contact information for the ward leadership and coordinators. This info will be used for email CCs and contact cards.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coordinators */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Sacrament Coordinators</h3>
          {['coord1', 'coord2'].map(role => (
            <div key={role} className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">NAME</label>
                <input value={leadership[role].name} onChange={e => handleLeadershipChange(role, 'name', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200" />
              </div>
              {/* Stack vertically on mobile, side-by-side on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">EMAIL</label>
                  <input value={leadership[role].email} onChange={e => handleLeadershipChange(role, 'email', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">PHONE</label>
                  <input value={leadership[role].phone} onChange={e => handleLeadershipChange(role, 'phone', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bishopric */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Bishopric (CC'd on Emails)</h3>
          {['bishop', 'clerk'].map(role => (
            <div key={role} className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{role} NAME</label>
                <input value={leadership[role].name} onChange={e => handleLeadershipChange(role, 'name', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">EMAIL</label>
                  <input value={leadership[role].email} onChange={e => handleLeadershipChange(role, 'email', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">PHONE</label>
                  <input value={leadership[role].phone} onChange={e => handleLeadershipChange(role, 'phone', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRoster = () => {
    const activeCoordinator = leadership[selectedCoordinatorKey];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sunday Selector Sidebar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit transition-colors duration-200">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">Upcoming Sundays</h2>
          <div className="space-y-2">
            {upcomingSundays.map((dateStr) => {
              const isSelected = selectedDate === dateStr;
              const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
              });
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`w-full text-left p-3 rounded-lg font-medium transition-colors duration-200 ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {formattedDate}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Area */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-4">
            Assignments for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </h2>

          {/* Coordinator Section */}
          <div className="mb-8 p-4 sm:p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/50 transition-colors duration-200">
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">Who is coordinating this week?</label>
            <select
              value={selectedCoordinatorKey}
              onChange={(e) => setSelectedCoordinatorKey(e.target.value)}
              className="w-full max-w-md p-2.5 border border-blue-200 dark:border-blue-800 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors duration-200"
            >
              <option value="">Select Coordinator...</option>
              <option value="coord1">{leadership.coord1.name}</option>
              <option value="coord2">{leadership.coord2.name}</option>
            </select>
            
            {activeCoordinator && (
              <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-900/50 text-sm flex flex-col sm:flex-row gap-2 sm:gap-6 text-gray-600 dark:text-gray-300">
                <div><span className="font-semibold text-gray-800 dark:text-gray-100">Email:</span> {activeCoordinator.email}</div>
                <div><span className="font-semibold text-gray-800 dark:text-gray-100">Phone:</span> {activeCoordinator.phone}</div>
              </div>
            )}
          </div>

          {/* Deliverers Section */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Assign Deliverers</label>
            <div className="space-y-4 sm:space-y-3">
              {deliverers.map((d, index) => (
                // This wrapper handles the mobile stacking (flex-col) and desktop inline (sm:flex-row)
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-0 bg-gray-50 dark:bg-gray-900/50 sm:bg-transparent rounded-lg border border-gray-100 dark:border-gray-700 sm:border-none relative">
                  
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-bold sm:w-6 sm:text-right">
                    <span className="sm:hidden">Deliverer </span>#{index + 1}
                  </span>
                  
                  <input
                    type="text"
                    placeholder="Deliverer Name"
                    value={d.name}
                    onChange={(e) => handleDelivererChange(index, 'name', e.target.value)}
                    className="w-full sm:flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors duration-200"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={d.email}
                    onChange={(e) => handleDelivererChange(index, 'email', e.target.value)}
                    className="w-full sm:flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors duration-200"
                  />
                  
                  {/* Remove Button - Positioned absolutely on mobile so it stays in the top right corner of the card */}
                  {deliverers.length > 4 ? (
                    <button 
                      onClick={() => removeDelivererSlot(index)} 
                      className="absolute top-2 right-2 sm:static sm:top-auto sm:right-auto text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-2 font-bold text-lg transition-colors bg-white dark:bg-gray-800 sm:bg-transparent rounded-full shadow-sm sm:shadow-none h-8 w-8 sm:h-auto sm:w-auto flex items-center justify-center"
                    >
                      ✕
                    </button>
                  ) : (
                    <div className="hidden sm:block w-8"></div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addDelivererSlot}
              className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors"
            >
              <span className="text-xl mr-1 leading-none">+</span> Add Another Deliverer
            </button>
          </div>

          {/* Action Button */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <button
              onClick={handleSaveAndSend}
              disabled={isSaving || !selectedCoordinatorKey}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200"
            >
              {isSaving ? 'Processing...' : 'Save & Send Emails'}
            </button>
            {statusMessage && (
              <span className="text-sm font-semibold text-center sm:text-left text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-4 py-3 sm:py-2 rounded-md transition-colors">
                {statusMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {/* Reduced base padding on mobile (p-4) vs desktop (sm:p-6) */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 font-sans transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          {/* Header stacks on mobile, side-by-side on desktop */}
          <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 transition-colors duration-200">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Sacrament Roster</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">YSA 2nd Ward - Takapuna</p>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-lg sm:rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors flex items-center gap-2"
            >
              {isDarkMode ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </button>
          </header>

          {/* Navigation Tabs - Full width grid on mobile, side-by-side buttons on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:gap-2 gap-2 mb-6">
            <button 
              onClick={() => setActiveTab('roster')}
              className={`px-4 sm:px-5 py-3 sm:py-2.5 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 ${
                activeTab === 'roster' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Manage Roster
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 sm:px-5 py-3 sm:py-2.5 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Render Active View */}
          {activeTab === 'roster' ? renderRoster() : renderSettings()}

        </div>
      </div>
    </div>
  );
}
