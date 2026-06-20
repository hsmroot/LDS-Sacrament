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
  
  // Roster Assignment Categories
  const [preparers, setPreparers] = useState([{ name: '', email: '' }, { name: '', email: '' }]); // 2 default
  const [administrators, setAdministrators] = useState([{ name: '', email: '' }, { name: '', email: '' }]); // 2 default
  const [deliverers, setDeliverers] = useState([{ name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }]); // 4 default
  const [cleanup, setCleanup] = useState([{ name: '', email: '' }, { name: '', email: '' }]); // 2 default

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

  // Reset all form categories when clicking a different Sunday
  useEffect(() => {
    setSelectedCoordinatorKey('');
    setPreparers([{ name: '', email: '' }, { name: '', email: '' }]);
    setAdministrators([{ name: '', email: '' }, { name: '', email: '' }]);
    setDeliverers([{ name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }]);
    setCleanup([{ name: '', email: '' }, { name: '', email: '' }]);
    setStatusMessage(null);
  }, [selectedDate]);

  // --- Generic Handlers for All Assignment Categories ---
  const handleLeadershipChange = (role, field, value) => {
    setLeadership(prev => ({ ...prev, [role]: { ...prev[role], [field]: value } }));
  };

  const handleSlotChange = (setter, list, index, field, value) => {
    const updated = [...list];
    updated[index][field] = value;
    setter(updated);
  };

  const addSlot = (setter, list) => setter([...list, { name: '', email: '' }]);
  
  const removeSlot = (setter, list, index, minLength) => {
    if (list.length <= minLength) return;
    setter(list.filter((_, i) => i !== index));
  };

  // --- Webhook & Email Compilation ---
  const handleSaveAndSend = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    // 🛑 PASTE YOUR ZAPIER OR MAKE.COM WEBHOOK URL HERE 🛑
    const WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/YOUR_URL_HERE";

    const activeCoordinator = leadership[selectedCoordinatorKey];
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
    const wardInfo = "YSA 2nd Ward (Takapuna)";

    // Filter out unentered slots
    const validPreparers = preparers.filter(d => d.name.trim() !== '' || d.email.trim() !== '');
    const validAdmins = administrators.filter(d => d.name.trim() !== '' || d.email.trim() !== '');
    const validDeliverers = deliverers.filter(d => d.name.trim() !== '' || d.email.trim() !== '');
    const validCleanup = cleanup.filter(d => d.name.trim() !== '' || d.email.trim() !== '');

    const emailsToSend = [];
    const contactFooter = `If you have any questions or need to arrange a substitute, please contact your sacrament coordinator, ${activeCoordinator?.name || 'your coordinator'}, at ${activeCoordinator?.phone || 'N/A'} or ${activeCoordinator?.email || 'N/A'}.\n\nThank you for your service!`;

    // 1. Preparer Emails
    validPreparers.forEach(person => {
      if (person.email) {
        emailsToSend.push({
          to: person.email,
          cc: "",
          subject: `Sacrament Preparation Assignment: ${wardInfo} - ${formattedDate}`,
          body: `Dear ${person.name || 'Brother'},\n\nYou have been assigned to PREPARE the sacrament this coming Sunday, ${formattedDate}, for the ${wardInfo}.\n\n*** Please arrive at least 20 minutes before the meeting begins to ensure the bread and water trays are fully set up. ***\n\n${contactFooter}`
        });
      }
    });

    // 2. Administrator (Blessing) Emails
    validAdmins.forEach(person => {
      if (person.email) {
        emailsToSend.push({
          to: person.email,
          cc: "",
          subject: `Sacrament Administration Assignment: ${wardInfo} - ${formattedDate}`,
          body: `Dear ${person.name || 'Brother'},\n\nYou have been assigned to ADMINISTER (bless) the sacrament this coming Sunday, ${formattedDate}, for the ${wardInfo}.\n\n*** Please ensure you are seated on the stand at least 15 minutes before the meeting begins. ***\n\n${contactFooter}`
        });
      }
    });

    // 3. Deliverer (Passing) Emails
    validDeliverers.forEach(person => {
      if (person.email) {
        emailsToSend.push({
          to: person.email,
          cc: "",
          subject: `Sacrament Delivery Assignment: ${wardInfo} - ${formattedDate}`,
          body: `Dear ${person.name || 'Brother'},\n\nYou have been assigned to DELIVER (pass) the sacrament this coming Sunday, ${formattedDate}, for the ${wardInfo}.\n\n*** Please ensure you are seated near the front at least 15 minutes before the beginning of the sacrament. ***\n\n${contactFooter}`
        });
      }
    });

    // 4. Clean-up Emails
    validCleanup.forEach(person => {
      if (person.email) {
        emailsToSend.push({
          to: person.email,
          cc: "",
          subject: `Sacrament Clean-up Assignment: ${wardInfo} - ${formattedDate}`,
          body: `Dear ${person.name || 'Brother'},\n\nYou have been assigned to POST-SACRAMENT CLEAN-UP this coming Sunday, ${formattedDate}, for the ${wardInfo}.\n\n*** Immediately following the conclusion of the meeting, please return to the sacrament room to empty water cups, dispose of remaining bread, and clear the linen cleanly. ***\n\n${contactFooter}`
        });
      }
    });

    // 5. Bishopric Summary Email
    const formatListText = (arr, emptyLabel) => arr.length > 0 
      ? arr.map((d, i) => `  ${i + 1}. ${d.name || 'Unknown'} - ${d.email || 'No Email'}`).join('\n')
      : `  [None Assigned]`;

    emailsToSend.push({
      to: leadership.bishop.email,
      cc: leadership.clerk.email,
      subject: `Roster Finalized: ${wardInfo} Sacrament - ${formattedDate}`,
      body: `Dear ${leadership.bishop.name} & ${leadership.clerk.name},\n\nThe sacrament delivery roster for the ${wardInfo} on ${formattedDate} has been finalized.\n\nCoordinator in Charge: ${activeCoordinator?.name || 'None Assigned'}\n\nSACRAMENT PREPARERS:\n${formatListText(validPreparers)}\n\nSACRAMENT ADMINISTRATORS (BLESSING):\n${formatListText(validAdmins)}\n\nSACRAMENT DELIVERERS (PASSING):\n${formatListText(validDeliverers)}\n\nPOST-SACRAMENT CLEAN-UP:\n${formatListText(validCleanup)}\n\nAutomated instructions and arrival reminders have been dispatched to all participants.`
    });

    // 6. Coordinator Confirmation Email
    if (activeCoordinator?.email) {
      emailsToSend.push({
        to: activeCoordinator.email,
        cc: "",
        subject: `Confirmation: Full Roster Dispatched - ${formattedDate}`,
        body: `Dear ${activeCoordinator.name},\n\nThank you for organizing the roster. All sacrament assignments (Preparation, Administration, Delivery, and Clean-up) for the ${wardInfo} have been successfully dispatched to your participants, and the Bishopric has been notified.`
      });
    }

    // Dispatch
    try {
      if (WEBHOOK_URL.includes("YOUR_URL_HERE")) {
        console.log("Full Roster Packages generated successfully! Add your webhook URL to send them.");
        console.log(emailsToSend);
        setStatusMessage('Success! (Simulated - Add Webhook URL to dispatch real emails)');
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

  // --- Reusable Render Helper for Input Sections ---
  const renderAssignmentSection = (title, subtitle, list, setter, defaultLength) => (
    <div className="mb-8 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 transition-colors duration-200">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide text-sm sm:text-base">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-4 sm:space-y-3">
        {list.map((d, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-0 bg-white dark:bg-gray-800 sm:bg-transparent rounded-lg border border-gray-200/60 dark:border-gray-700 sm:border-none relative shadow-sm sm:shadow-none">
            <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-bold sm:w-8 sm:text-right">
              <span className="sm:hidden">Spot </span>#{index + 1}
            </span>
            <input
              type="text"
              placeholder="Name"
              value={d.name}
              onChange={(e) => handleSlotChange(setter, list, index, 'name', e.target.value)}
              className="w-full sm:flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm sm:shadow-none text-sm transition-colors duration-200"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={d.email}
              onChange={(e) => handleSlotChange(setter, list, index, 'email', e.target.value)}
              className="w-full sm:flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm sm:shadow-none text-sm transition-colors duration-200"
            />
            {list.length > defaultLength ? (
              <button 
                onClick={() => removeSlot(setter, list, index, defaultLength)} 
                className="absolute top-2 right-2 sm:static sm:top-auto sm:right-auto text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-2 font-bold text-lg transition-colors bg-gray-50 dark:bg-gray-700 sm:bg-transparent rounded-full h-7 w-7 sm:h-auto sm:w-auto flex items-center justify-center"
              >
                ✕
              </button>
            ) : (
              <div className="hidden sm:block w-7"></div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => addSlot(setter, list)}
        className="mt-4 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors"
      >
        <span className="text-lg mr-1 leading-none">+</span> Add Another {title.split(' ')[1] || 'Spot'}
      </button>
    </div>
  );

  // --- Render Views ---
  const renderSettings = () => (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fadeIn transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Leadership & Contacts</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update the contact information for the ward leadership and coordinators. This info will be used for email CCs and contact cards.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 sm:space-y-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Sacrament Coordinators</h3>
          {['coord1', 'coord2'].map(role => (
            <div key={role} className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">NAME</label>
                <input value={leadership[role].name} onChange={e => handleLeadershipChange(role, 'name', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">EMAIL</label>
                  <input value={leadership[role].email} onChange={e => handleLeadershipChange(role, 'email', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">PHONE</label>
                  <input value={leadership[role].phone} onChange={e => handleLeadershipChange(role, 'phone', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Bishopric (CC'd on Emails)</h3>
          {['bishop', 'clerk'].map(role => (
            <div key={role} className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{role} NAME</label>
                <input value={leadership[role].name} onChange={e => handleLeadershipChange(role, 'name', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">EMAIL</label>
                  <input value={leadership[role].email} onChange={e => handleLeadershipChange(role, 'email', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">PHONE</label>
                  <input value={leadership[role].phone} onChange={e => handleLeadershipChange(role, 'phone', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200" />
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
                      ? 'bg-blue-600 text-white shadow-md font-bold' 
                      : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {formattedDate}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Roster Entry Area */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-4">
            Assignments for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </h2>

          {/* Coordinator Selection */}
          <div className="mb-8 p-4 sm:p-5 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/50 transition-colors duration-200">
            <label className="block text-sm font-semibold text-blue-950 dark:text-blue-300 mb-3">Who is coordinating this week?</label>
            <select
              value={selectedCoordinatorKey}
              onChange={(e) => setSelectedCoordinatorKey(e.target.value)}
              className="w-full max-w-md p-2.5 border border-blue-200 dark:border-blue-800 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors duration-200 text-sm"
            >
              <option value="">Select Coordinator...</option>
              <option value="coord1">{leadership.coord1.name}</option>
              <option value="coord2">{leadership.coord2.name}</option>
            </select>
            
            {activeCoordinator && (
              <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-900/50 text-xs sm:text-sm flex flex-col sm:flex-row gap-1 sm:gap-6 text-gray-600 dark:text-gray-300">
                <div><span className="font-semibold text-gray-800 dark:text-gray-100">Email:</span> {activeCoordinator.email}</div>
                <div><span className="font-semibold text-gray-800 dark:text-gray-100">Phone:</span> {activeCoordinator.phone}</div>
              </div>
            )}
          </div>

          {/* Roster Input Sections */}
          {renderAssignmentSection("1. Sacrament Preparers", "Arrive 20 mins early to prepare bread and water trays.", preparers, setPreparers, 2)}
          {renderAssignmentSection("2. Sacrament Administrators", "Seated on stand 15 mins early to bless the sacrament.", administrators, setAdministrators, 2)}
          {renderAssignmentSection("3. Sacrament Deliverers", "Seated at front 15 mins early to pass the sacrament.", deliverers, setDeliverers, 4)}
          {renderAssignmentSection("4. Post-Sacrament Clean-up", "Return to sacrament room immediately after meeting to clear trays.", cleanup, setCleanup, 2)}

          {/* Action Button Controls */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <button
              onClick={handleSaveAndSend}
              disabled={isSaving || !selectedCoordinatorKey}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-all duration-200 text-sm sm:text-base cursor-pointer"
            >
              {isSaving ? 'Processing Packages...' : 'Save & Dispatch All Notifications'}
            </button>
            {statusMessage && (
              <span className="text-xs sm:text-sm font-semibold text-center sm:text-left text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-4 py-3 sm:py-2.5 rounded-lg border border-green-200 dark:border-green-800/60 transition-colors">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 font-sans transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 transition-colors duration-200">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Sacrament Roster</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm sm:text-base">YSA 2nd Ward - Takapuna</p>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-lg sm:rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isDarkMode ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </button>
          </header>

          <div className="grid grid-cols-2 sm:flex sm:gap-2 gap-2 mb-6">
            <button 
              onClick={() => setActiveTab('roster')}
              className={`px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'roster' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Manage Roster
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Settings
            </button>
          </div>

          {activeTab === 'roster' ? renderRoster() : renderSettings()}

        </div>
      </div>
    </div>
  );
}
