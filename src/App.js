import React, { useState, useEffect } from 'react';

// Helper: Strict Email Syntax Validator
const isValidEmail = (str) => {
  if (!str || typeof str !== 'string') return false;
  const cleaned = str.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned);
};

// 1. DYNAMIC DATE HELPER
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

// 2. MAIN APP COMPONENT
export default function App() {
  const [activeTab, setActiveTab] = useState('roster');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const upcomingSundays = getUpcomingSundays();
  const [selectedDate, setSelectedDate] = useState(upcomingSundays[0]);

  // Master Leadership & CC Directory
  const [leadership, setLeadership] = useState({
    bishop: { name: 'Bishop Clarke', email: 'bishop@ward.org', phone: '555-0001' },
    clerk: { name: 'Ryan', email: 'clerk@ward.org', phone: '555-0002' },
    specialist: { name: 'Tech Specialist', email: 'YOUR_REAL_EMAIL@gmail.com', phone: '555-0005' },
    coord1: { name: 'Moroni', email: 'moroni@ward.org', phone: '555-0003' },
    coord2: { name: 'Hari', email: 'hari@ward.org', phone: '555-0004' }
  });

  const [selectedCoordinatorKey, setSelectedCoordinatorKey] = useState('');
  const [preparers, setPreparers] = useState([{ name: '', email: '' }, { name: '', email: '' }]); 
  const [administrators, setAdministrators] = useState([{ name: '', email: '' }, { name: '', email: '' }]); 
  const [deliverers, setDeliverers] = useState([{ name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }]); 
  const [cleanup, setCleanup] = useState([{ name: '', email: '' }, { name: '', email: '' }]); 

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.onload = () => window.tailwind.config = { darkMode: 'class' };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    isDarkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    setSelectedCoordinatorKey('');
    setPreparers([{ name: '', email: '' }, { name: '', email: '' }]);
    setAdministrators([{ name: '', email: '' }, { name: '', email: '' }]);
    setDeliverers([{ name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }]);
    setCleanup([{ name: '', email: '' }, { name: '', email: '' }]);
    setStatusMessage(null);
  }, [selectedDate]);

  const handleLeadershipChange = (role, field, value) => setLeadership(prev => ({ ...prev, [role]: { ...prev[role], [field]: value } }));
  const handleSlotChange = (setter, list, index, field, value) => { const updated = [...list]; updated[index][field] = value; setter(updated); };
  const addSlot = (setter, list) => setter([...list, { name: '', email: '' }]);
  const removeSlot = (setter, list, index, minLength) => { if (list.length > minLength) setter(list.filter((_, i) => i !== index)); };

  // --- LIVE MAKE.COM HTML DISPATCH ENGINE ---
  const handleSaveAndSend = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const WEBHOOK_URL = "https://hook.us2.make.com/fif1k4koecfx50ulob7h8b9d5lp5a33v";
    const activeCoordinator = leadership[selectedCoordinatorKey];
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const wardInfo = "YSA 2nd Ward (Takapuna)";

    // Emergency Master Fallbacks
    const emergencyFallback = isValidEmail(leadership.specialist?.email) ? leadership.specialist.email.trim() : "noreply@make.com";
    const safeBishopEmail = isValidEmail(leadership.bishop?.email) ? leadership.bishop.email.trim() : emergencyFallback;

    const validPreparers = preparers.filter(d => d.name.trim() !== '' || d.email.trim() !== '');
    const validAdmins = administrators.filter(d => d.name.trim() !== '' || d.email.trim() !== '');
    const validDeliverers = deliverers.filter(d => d.name.trim() !== '' || d.email.trim() !== '');
    const validCleanup = cleanup.filter(d => d.name.trim() !== '' || d.email.trim() !== '');

    const emailsToSend = [];
    const htmlFooter = `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px 0;" /><p style="font-size: 13px; color: #6b7280;">If you have questions or need to arrange a substitute, contact <strong>${activeCoordinator?.name || 'your coordinator'}</strong>: 📞 ${activeCoordinator?.phone || 'N/A'} | ✉️ <a href="mailto:${activeCoordinator?.email || ''}" style="color: #2563eb;">${activeCoordinator?.email || 'N/A'}</a></p>`;

    // 1-4. Push Individual Assignments (Guaranteed Valid Only)
    const assignmentGroups = [
      { type: 'Preparation', list: validPreparers, timeNote: 'Please arrive at least 20 minutes before the meeting begins.' },
      { type: 'Administration', list: validAdmins, timeNote: 'Please ensure you are seated on the stand at least 15 minutes before the meeting begins.' },
      { type: 'Delivery', list: validDeliverers, timeNote: 'Please ensure you are seated near the front at least 15 minutes before the sacrament begins.' },
      { type: 'Clean-up', list: validCleanup, timeNote: 'Immediately following the meeting, please return to the sacrament room to clear trays cleanly.' }
    ];

    assignmentGroups.forEach(group => {
      group.list.forEach(person => {
        if (isValidEmail(person.email)) {
          emailsToSend.push({
            to: person.email.trim(),
            cc: "",
            subject: `Sacrament ${group.type} Assignment: ${wardInfo} - ${formattedDate}`,
            body: `<div style="font-family: sans-serif; color: #1f2937; max-width: 600px;"><p style="font-size: 16px;">Dear ${person.name || 'Brother'},</p><p style="font-size: 16px; line-height: 1.5;">You have been assigned to <strong>${group.type.toUpperCase()}</strong> the sacrament this Sunday, <strong>${formattedDate}</strong>, for the ${wardInfo}.</p><div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0;"><p style="margin: 0; color: #92400e; font-size: 14px;"><strong>⏰ Duty Note:</strong> ${group.timeNote}</p></div><p style="font-size: 15px;">Thank you for your service!</p>${htmlFooter}</div>`
          });
        }
      });
    });

    // 5. Master Leadership Digest (With Ironclad CC Fallback)
    const renderHtmlList = (arr) => arr.length > 0 
      ? arr.map(d => `<li style="margin-bottom: 4px;"><strong>${d.name || 'Unknown'}</strong> <span style="color:#666;">(${d.email || 'No Email'})</span></li>`).join('')
      : `<li><em style="color:#999;">None assigned</em></li>`;

    // Strictly filter the CC group
    const cleanCcList = [leadership.clerk?.email, leadership.specialist?.email, leadership.coord1?.email]
      .filter(isValidEmail)
      .map(e => e.trim());

    // If user left all CCs blank, feed the safeBishop into CC so Make receives a valid string
    const masterCcString = cleanCcList.length > 0 ? cleanCcList.join(', ') : safeBishopEmail;

    emailsToSend.push({
      to: safeBishopEmail,
      cc: masterCcString,
      subject: `Roster Finalized: ${wardInfo} Sacrament - ${formattedDate}`,
      body: `<div style="font-family: sans-serif; color: #1f2937; max-width: 650px;"><h2 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Sacrament Master Roster</h2><p style="font-size: 15px;"><strong>Date:</strong> ${formattedDate}<br/><strong>Coordinator:</strong> ${activeCoordinator?.name || 'None Assigned'}</p><h4 style="color: #4b5563; margin-top: 16px;">1. Preparers</h4><ul>${renderHtmlList(validPreparers)}</ul><h4 style="color: #4b5563; margin-top: 16px;">2. Administrators (Blessing)</h4><ul>${renderHtmlList(validAdmins)}</ul><h4 style="color: #4b5563; margin-top: 16px;">3. Deliverers (Passing)</h4><ul>${renderHtmlList(validDeliverers)}</ul><h4 style="color: #4b5563; margin-top: 16px;">4. Clean-up</h4><ul>${renderHtmlList(validCleanup)}</ul></div>`
    });

    // Fire actual requests to Make.com
    let successCount = 0;
    try {
      for (const emailData of emailsToSend) {
        const res = await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailData) });
        if (res.ok) successCount++;
      }
      setStatusMessage(`Success! Successfully pushed ${successCount} valid assignment emails.`);
    } catch (error) {
      setStatusMessage('Error: Could not reach Make.com. Check internet connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettings = () => (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Leadership & CC Directory</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update contact info. Malformed emails will be automatically ignored by the pre-flight scanner to protect the server.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 border-b pb-2">Coordinators</h3>
          {['coord1', 'coord2'].map(role => (
            <div key={role} className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-500 uppercase">{role === 'coord1' ? 'Coord 1 (Moroni)' : 'Coord 2 (Hari)'}</label>
              <input value={leadership[role].name} onChange={e => handleLeadershipChange(role, 'name', e.target.value)} placeholder="Name" className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <input value={leadership[role].email} onChange={e => handleLeadershipChange(role, 'email', e.target.value)} placeholder="Email" className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                <input value={leadership[role].phone} onChange={e => handleLeadershipChange(role, 'phone', e.target.value)} placeholder="Phone" className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 border-b pb-2">Leadership (CC Group)</h3>
          {['bishop', 'clerk', 'specialist'].map(role => (
            <div key={role} className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-500 uppercase">{role === 'specialist' ? 'Tech Specialist (You)' : role}</label>
              <input value={leadership[role].name} onChange={e => handleLeadershipChange(role, 'name', e.target.value)} placeholder="Name" className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <input value={leadership[role].email} onChange={e => handleLeadershipChange(role, 'email', e.target.value)} placeholder="Email" className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                <input value={leadership[role].phone} onChange={e => handleLeadershipChange(role, 'phone', e.target.value)} placeholder="Phone" className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssignmentSection = (title, subtitle, list, setter, defaultLength) => (
    <div className="mb-8 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
      <div className="mb-4"><h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase text-sm sm:text-base">{title}</h3><p className="text-xs text-gray-500 mt-0.5">{subtitle}</p></div>
      <div className="space-y-3">
        {list.map((d, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-center gap-2 p-3 sm:p-0 bg-white dark:bg-gray-800 sm:bg-transparent rounded-lg border sm:border-none relative">
            <span className="text-gray-400 text-xs font-bold sm:w-8">#{index + 1}</span>
            <input type="text" placeholder="Name" value={d.name} onChange={e => handleSlotChange(setter, list, index, 'name', e.target.value)} className="w-full sm:flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="email" placeholder="Email Address" value={d.email} onChange={e => handleSlotChange(setter, list, index, 'email', e.target.value)} className="w-full sm:flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            {list.length > defaultLength ? (
              <button onClick={() => removeSlot(setter, list, index, defaultLength)} className="text-gray-400 hover:text-red-600 font-bold px-2">✕</button>
            ) : <div className="hidden sm:block w-7"></div>}
          </div>
        ))}
      </div>
      <button onClick={() => addSlot(setter, list)} className="mt-4 text-xs font-semibold text-blue-600 flex items-center">+ Add Another</button>
    </div>
  );

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 font-sans">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6 flex justify-between items-center border-b pb-4">
            <div><h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Sacrament Roster</h1><p className="text-gray-500 mt-1 font-medium text-sm">YSA 2nd Ward - Takapuna</p></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border text-sm font-medium dark:text-white">{isDarkMode ? '☀️ Light' : '🌙 Dark'}</button>
          </header>
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('roster')} className={`px-6 py-2.5 font-bold rounded-xl ${activeTab === 'roster' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border dark:text-white'}`}>Manage Roster</button>
            <button onClick={() => setActiveTab('settings')} className={`px-6 py-2.5 font-bold rounded-xl ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border dark:text-white'}`}>Settings</button>
          </div>
          {activeTab === 'roster' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border h-fit">
                <h2 className="font-semibold mb-3 text-sm uppercase dark:text-white">Sundays</h2>
                <div className="space-y-2">
                  {upcomingSundays.map(dateStr => (
                    <button key={dateStr} onClick={() => setSelectedDate(dateStr)} className={`w-full text-left p-2.5 rounded-lg text-sm font-medium ${selectedDate === dateStr ? 'bg-blue-600 text-white font-bold' : 'bg-gray-50 dark:bg-gray-700 dark:text-white'}`}>
                      {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl border">
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100">
                  <label className="block text-sm font-semibold text-blue-950 dark:text-blue-300 mb-2">Coordinating this week?</label>
                  <select value={selectedCoordinatorKey} onChange={e => setSelectedCoordinatorKey(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white text-sm">
                    <option value="">Select Coordinator...</option><option value="coord1">{leadership.coord1.name}</option><option value="coord2">{leadership.coord2.name}</option>
                  </select>
                </div>
                {renderAssignmentSection("1. Preparers", "Arrive 20 mins early.", preparers, setPreparers, 2)}
                {renderAssignmentSection("2. Administrators", "Seated on stand 15 mins early.", administrators, setAdministrators, 2)}
                {renderAssignmentSection("3. Deliverers", "Seated at front 15 mins early.", deliverers, setDeliverers, 4)}
                {renderAssignmentSection("4. Clean-up", "Return to room immediately after meeting.", cleanup, setCleanup, 2)}
                <div className="pt-6 border-t flex justify-between items-center">
                  <button onClick={handleSaveAndSend} disabled={isSaving || !selectedCoordinatorKey} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-md text-sm cursor-pointer">
                    {isSaving ? 'Transmitting...' : 'Save & Dispatch All Notifications'}
                  </button>
                  {statusMessage && <span className="text-sm font-semibold text-green-600">{statusMessage}</span>}
                </div>
              </div>
            </div>
          ) : renderSettings()}
        </div>
      </div>
    </div>
  );
}
