import React, { useState, useEffect } from 'react';

// ==========================================
// 0. STRICT PRE-FLIGHT VALIDATORS
// ==========================================
const isValidEmail = (str) => {
  if (!str || typeof str !== 'string') return false;
  const cleaned = str.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned);
};

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
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  // --- APP DASHBOARD STATE ---
  const [activeTab, setActiveTab] = useState('roster');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const upcomingSundays = getUpcomingSundays();
  const [selectedDate, setSelectedDate] = useState(upcomingSundays[0]);

  const [leadership, setLeadership] = useState({
    bishop: { name: 'Bishop Clarke', email: 'bishop@ward.org', phone: '555-0001' },
    clerk: { name: 'Ryan', email: 'clerk@ward.org', phone: '555-0002' },
    specialist: { name: 'Tech Specialist (You)', email: 'hmenon134@gmail.com', phone: '555-0005' },
    coord1: { name: 'Moroni', email: 'moroni@ward.org', phone: '555-0003' },
    coord2: { name: 'Hari', email: 'hari@ward.org', phone: '555-0004' }
  });

  const [selectedCoordinatorKey, setSelectedCoordinatorKey] = useState('');
  
  // --- ASSIGNMENT LIST STATES ---
  const [preparers, setPreparers] = useState([{ name: '', email: '' }, { name: '', email: '' }]); 
  const [administrators, setAdministrators] = useState([{ name: '', email: '' }, { name: '', email: '' }]); 
  const [deliverers, setDeliverers] = useState([{ name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }]); 
  const [cleanup, setCleanup] = useState([{ name: '', email: '' }, { name: '', email: '' }]); 
  const [breadProviders, setBreadProviders] = useState([{ name: '', email: '' }]); // New Bread Provider state

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

  // Reset all fields when a new date is selected
  useEffect(() => {
    setSelectedCoordinatorKey('');
    setPreparers([{ name: '', email: '' }, { name: '', email: '' }]);
    setAdministrators([{ name: '', email: '' }, { name: '', email: '' }]);
    setDeliverers([{ name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }]);
    setCleanup([{ name: '', email: '' }, { name: '', email: '' }]);
    setBreadProviders([{ name: '', email: '' }]);
    setStatusMessage(null);
  }, [selectedDate]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (authUsername.trim().toLowerCase() === 'sacrament' && authPassword === 'BishopClarkeIsCool') {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLeadershipChange = (role, field, value) => setLeadership(prev => ({ ...prev, [role]: { ...prev[role], [field]: value } }));
  const handleSlotChange = (setter, list, index, field, value) => { const updated = [...list]; updated[index][field] = value; setter(updated); };
  const addSlot = (setter, list) => setter([...list, { name: '', email: '' }]);
  const removeSlot = (setter, list, index, minLength) => { if (list.length > minLength) setter(list.filter((_, i) => i !== index)); };

  // --- LIVE BREVO API DISPATCH ENGINE ---
  const handleSaveAndSend = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const WEBHOOK_URL = "https://hook.us2.make.com/rs4v4lmwkwm43w1i8p5ccag8pkdv64gt";

    const activeCoordinator = leadership[selectedCoordinatorKey];
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const wardInfo = "YSA 2nd Ward (Takapuna)";

    // Harvest verified emails
    const validPreparers = preparers.filter(d => isValidEmail(d.email));
    const validAdmins = administrators.filter(d => isValidEmail(d.email));
    const validDeliverers = deliverers.filter(d => isValidEmail(d.email));
    const validCleanup = cleanup.filter(d => isValidEmail(d.email));
    const validBreadProviders = breadProviders.filter(d => isValidEmail(d.email));

    const emailsToSend = [];
    
    const htmlPreHeader = `<span style="display:none;font-size:1px;color:#ffffff;max-height:0px;opacity:0;">Sacrament duty update and schedule confirmation for this Sunday meeting.</span>`;

    const htmlFooter = `
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px 0;" />
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0;">
        If you have questions or need to arrange a substitute, please contact your coordinator, <strong>${activeCoordinator?.name || 'your coordinator'}</strong>:
      </p>
      <p style="font-size: 13px; color: #6b7280; margin: 0;">
        📞 ${activeCoordinator?.phone || 'N/A'} &nbsp;|&nbsp; ✉️ <a href="mailto:${activeCoordinator?.email || ''}" style="color: #2563eb;">${activeCoordinator?.email || 'N/A'}</a>
      </p>
    `;

    // 1-5. Push Individual Participant Reminders (Includes Bread Provider)
    const assignmentBatches = [
      { type: 'Preparation', list: validPreparers, sub: 'Sacrament setup', timeNote: 'Please arrive at least 20 minutes before the meeting begins to set up trays.' },
      { type: 'Administration', list: validAdmins, sub: 'Sacrament blessing', timeNote: 'Please ensure you are seated on the stand at least 15 minutes before the meeting begins.' },
      { type: 'Delivery', list: validDeliverers, sub: 'Sacrament passing', timeNote: 'Please ensure you are seated near the front at least 15 minutes before the sacrament begins.' },
      { type: 'Clean-up', list: validCleanup, sub: 'Sacrament clean-up', timeNote: 'Immediately following the conclusion of the meeting, please return to the room to clear trays.' },
      { type: 'Bread Provision', list: validBreadProviders, sub: 'Sacrament bread supply', timeNote: 'Please bring fresh white bread and deliver it to the prep room at least 20 minutes before the meeting begins.' }
    ];

    assignmentBatches.forEach(batch => {
      batch.list.forEach(person => {
        emailsToSend.push({
          to: person.email.trim().toLowerCase(),
          subject: `${batch.sub} schedule for ${formattedDate} (${wardInfo})`,
          body: `<div style="font-family: sans-serif; color: #1f2937; max-width: 600px;">${htmlPreHeader}<p style="font-size: 16px;">Dear ${person.name || 'Brother/Sister'},</p><p style="font-size: 16px; line-height: 1.5;">You have been assigned to <strong>${batch.type.toUpperCase()}</strong> for the sacrament this coming Sunday, <strong>${formattedDate}</strong>, for the ${wardInfo}.</p><div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;"><p style="margin: 0; color: #92400e; font-size: 14px;"><strong>⏰ Duty Note:</strong> ${batch.timeNote}</p></div><p style="font-size: 15px;">Thank you for your service!</p>${htmlFooter}</div>`
        });
      });
    });

    // 6. MASTER SUMMARY LOOP (Sanitized & Deduplicated Direct Copies)
    const renderHtmlList = (arr) => arr.length > 0 
      ? arr.map(d => `<li style="margin-bottom: 4px;"><strong>${d.name || 'Unknown'}</strong> &nbsp;<span style="color:#666;">(<a href="mailto:${d.email || ''}" style="color:#2563eb;">${d.email || 'No Email'}</a>)</span></li>`).join('')
      : `<li><em style="color:#999;">None assigned</em></li>`;

    const summaryHtmlBody = `<div style="font-family: sans-serif; color: #1f2937; max-width: 650px;">${htmlPreHeader}<h2 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Sacrament Master Roster</h2><p style="font-size: 15px;"><strong>Date:</strong> ${formattedDate}<br/><strong>Coordinator in Charge:</strong> ${activeCoordinator?.name || 'None Assigned'}</p><h4 style="color: #4b5563; margin: 20px 0 4px 0; text-transform: uppercase; font-size: 12px; tracking: wider;">1. Sacrament Preparers</h4><ul style="margin: 0 0 16px 0; padding-left: 20px;">${renderHtmlList(validPreparers)}</ul><h4 style="color: #4b5563; margin: 20px 0 4px 0; text-transform: uppercase; font-size: 12px;">2. Sacrament Administrators (Blessing)</h4><ul style="margin: 0 0 16px 0; padding-left: 20px;">${renderHtmlList(validAdmins)}</ul><h4 style="color: #4b5563; margin: 20px 0 4px 0; text-transform: uppercase; font-size: 12px;">3. Sacrament Deliverers (Passing)</h4><ul style="margin: 0 0 16px 0; padding-left: 20px;">${renderHtmlList(validDeliverers)}</ul><h4 style="color: #4b5563; margin: 20px 0 4px 0; text-transform: uppercase; font-size: 12px;">4. Post-Sacrament Clean-up</h4><ul style="margin: 0 0 16px 0; padding-left: 20px;">${renderHtmlList(validCleanup)}</ul><h4 style="color: #4b5563; margin: 20px 0 4px 0; text-transform: uppercase; font-size: 12px;">5. Bread Provider</h4><ul style="margin: 0 0 16px 0; padding-left: 20px;">${renderHtmlList(validBreadProviders)}</ul><p style="font-size: 12px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">Automated calendar instructions and arrival reminders have been safely dispatched to all verified participants listed above.</p></div>`;

    const digestRecipients = [
      leadership.bishop?.email,
      leadership.clerk?.email,
      leadership.specialist?.email,
      leadership.coord1?.email
    ].map(e => e?.trim().toLowerCase()).filter(isValidEmail);

    const uniqueDigestRecipients = [...new Set(digestRecipients)];

    uniqueDigestRecipients.forEach(leaderEmail => {
      emailsToSend.push({
        to: leaderEmail,
        subject: `Roster Finalized: ${wardInfo} Sacrament - ${formattedDate}`,
        body: summaryHtmlBody
      });
    });

    // 7. Coordinator Confirmation HTML
    if (isValidEmail(activeCoordinator?.email)) {
      emailsToSend.push({
        to: activeCoordinator.email.trim().toLowerCase(),
        subject: `Confirmation: Full Roster Dispatched - ${formattedDate}`,
        body: `<div style="font-family: sans-serif; color: #1f2937; max-width: 600px;">${htmlPreHeader}<p style="font-size: 16px;">Dear ${activeCoordinator.name},</p><p style="font-size: 16px; line-height: 1.5;">Thank you for organizing the roster. All verified sacrament assignments (Preparation, Administration, Delivery, Clean-up, and Bread Provision) for the <strong>${wardInfo}</strong> have been successfully transmitted to your participants, and the Bishopric has been notified.</p></div>`
      });
    }

    let successCount = 0;
    try {
      for (const emailData of emailsToSend) {
        const response = await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailData) });
        if (response.ok) successCount++;
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      setStatusMessage(`Success! Dispatched ${successCount} live HTML emails via Brevo.`);
    } catch (error) {
      console.error("Network Dispatch Error:", error);
      setStatusMessage('Error: Could not reach Make.com. Check internet connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAssignmentSection = (title, subtitle, list, setter, defaultLength) => (
    <div className="mb-8 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 transition-colors duration-200">
      <div className="mb-4"><h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide text-sm sm:text-base">{title}</h3>{subtitle && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}</div>
      <div className="space-y-4 sm:space-y-3">
        {list.map((d, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-0 bg-white dark:bg-gray-800 sm:bg-transparent rounded-lg border border-gray-200/60 dark:border-gray-700 sm:border-none relative shadow-sm sm:shadow-none">
            <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-bold sm:w-8 sm:text-right"><span className="sm:hidden">Spot </span>#{index + 1}</span>
            <input type="text" placeholder="Name" value={d.name} onChange={e => handleSlotChange(setter, list, index, 'name', e.target.value)} className="w-full sm:flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input type="email" placeholder="Email Address" value={d.email} onChange={e => handleSlotChange(setter, list, index, 'email', e.target.value)} className="w-full sm:flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            {list.length > defaultLength ? <button onClick={() => removeSlot(setter, list, index, defaultLength)} className="absolute top-2 right-2 sm:static sm:top-auto sm:right-auto text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-2 font-bold text-lg bg-gray-50 dark:bg-gray-700 sm:bg-transparent rounded-full h-7 w-7 sm:h-auto sm:w-auto flex items-center justify-center cursor-pointer">✕</button> : <div className="hidden sm:block w-7"></div>}
          </div>
        ))}
      </div>
      <button onClick={() => addSlot(setter, list)} className="mt-4 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center cursor-pointer"><span className="text-lg mr-1 leading-none">+</span> Add Another {title.split(' ')[1] || 'Spot'}</button>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Leadership Directory</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update contact info. The Bishopric, Clerk, Specialist, and active Coordinator automatically receive a full copy of the roster directly to their inbox.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 sm:space-y-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Sacrament Coordinators</h3>
          {['coord1', 'coord2'].map(role => (
            <div key={role} className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{role === 'coord1' ? 'COORDINATOR 1 (MORONI)' : 'COORDINATOR 2 (HARI)'} NAME</label>
              <input value={leadership[role].name} onChange={e => handleLeadershipChange(role, 'name', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input value={leadership[role].email} onChange={e => handleLeadershipChange(role, 'email', e.target.value)} placeholder="Email" className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" /><input value={leadership[role].phone} onChange={e => handleLeadershipChange(role, 'phone', e.target.value)} placeholder="Phone" className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          ))}
        </div>
        <div className="space-y-4 sm:space-y-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Leadership & Administration</h3>
          {['bishop', 'clerk', 'specialist'].map(role => (
            <div key={role} className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{role === 'specialist' ? 'TECH SPECIALIST (YOU)' : role} NAME</label>
              <input value={leadership[role].name} onChange={e => handleLeadershipChange(role, 'name', e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input value={leadership[role].email} onChange={e => handleLeadershipChange(role, 'email', e.target.value)} placeholder="Email" className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" /><input value={leadership[role].phone} onChange={e => handleLeadershipChange(role, 'phone', e.target.value)} placeholder="Phone" className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 3. SECURITY GATEWAY RENDERER
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden select-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-sm w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-white">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
              🔒
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Takapuna YSA Portal</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Sacrament Roster Management</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1">Username</label>
              <input 
                type="text"
                value={authUsername}
                onChange={(e) => { setAuthUsername(e.target.value); setAuthError(false); }}
                placeholder="Enter ward username"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-transparent transition text-sm font-medium"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1">Password</label>
              <input 
                type="password"
                value={authPassword}
                onChange={(e) => { setAuthPassword(e.target.value); setAuthError(false); }}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-transparent transition text-sm font-medium"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-xs font-semibold">
                <span>⚠️</span> Unauthorized ward credentials.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 mt-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition duration-150 cursor-pointer text-sm tracking-wide"
            >
              Verify & Unlock
            </button>
          </form>

          <div className="mt-8 text-center text-[11px] text-slate-600 font-medium tracking-wide">
            Automated Brevo Dispatch Engine • NZ
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. MAIN APP RENDERER
  // ==========================================
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 font-sans transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Sacrament Roster</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm sm:text-base">YSA 2nd Ward - Takapuna</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2.5 rounded-lg sm:rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 font-medium text-sm transition cursor-pointer">🔒 Lock</button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="px-4 py-2.5 rounded-lg sm:rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 font-medium text-sm flex items-center gap-2 cursor-pointer">{isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
            </div>
          </header>
          <div className="grid grid-cols-2 sm:flex sm:gap-2 gap-2 mb-6"><button onClick={() => setActiveTab('roster')} className={`px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base font-bold rounded-xl cursor-pointer ${activeTab === 'roster' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>Manage Roster</button><button onClick={() => setActiveTab('settings')} className={`px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base font-bold rounded-xl cursor-pointer ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>Settings</button></div>
          {activeTab === 'roster' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit"><h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">Upcoming Sundays</h2><div className="space-y-2">{upcomingSundays.map(dateStr => (<button key={dateStr} onClick={() => setSelectedDate(dateStr)} className={`w-full text-left p-3 rounded-lg font-medium cursor-pointer ${selectedDate === dateStr ? 'bg-blue-600 text-white font-bold shadow-md' : 'bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300'}`}>{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</button>))}</div></div>
              <div className="md:col-span-3 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-4">Assignments for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}</h2><div className="mb-8 p-4 sm:p-5 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/50"><label className="block text-sm font-semibold text-blue-950 dark:text-blue-300 mb-3">Who is coordinating?</label><select value={selectedCoordinatorKey} onChange={e => setSelectedCoordinatorKey(e.target.value)} className="w-full max-w-md p-2.5 border border-blue-200 dark:border-blue-800 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"><option value="">Select Coordinator...</option><option value="coord1">{leadership.coord1.name}</option><option value="coord2">{leadership.coord2.name}</option></select></div>{renderAssignmentSection("1. Sacrament Preparers", "Arrive 20 mins early.", preparers, setPreparers, 2)}{renderAssignmentSection("2. Sacrament Administrators", "Seated on stand 15 mins early.", administrators, setAdministrators, 2)}{renderAssignmentSection("3. Sacrament Deliverers", "Seated at front 15 mins early.", deliverers, setDeliverers, 4)}{renderAssignmentSection("4. Post-Sacrament Clean-up", "Return immediately after meeting.", cleanup, setCleanup, 2)}{renderAssignmentSection("5. Bread Providers", "Bring fresh bread 20 mins early.", breadProviders, setBreadProviders, 1)}<div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"><button onClick={handleSaveAndSend} disabled={isSaving || !selectedCoordinatorKey} className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-bold rounded-xl shadow-md text-sm sm:text-base cursor-pointer">{isSaving ? 'Transmitting to Make.com...' : 'Save & Dispatch All Notifications'}</button>{statusMessage && <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-4 py-2.5 rounded-lg border border-green-200">{statusMessage}</span>}</div></div>
            </div>
          ) : renderSettings()}
        </div>
      </div>
    </div>
  );
}
