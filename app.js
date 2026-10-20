// PawVault - Dog Medical & Health Data Manager
// Clean Production Version (Ready for Real Dog Data)

(function() {
  'use strict';

  // v2 keys ensure previous sample data (Cooper/Luna) is cleanly flushed
  const STORAGE_KEY = 'pawvault_dogs_data_v2';
  const ACTIVE_DOG_KEY = 'pawvault_active_dog_id_v2';

  // Empty by default for real user data
  const DEFAULT_DATA = [];

  // App State
  let dogsData = [];
  let activeDogId = null;
  let weightChartInstance = null;

  // Initialize
  function init() {
    // Purge legacy sample data if present in browser localStorage
    try {
      localStorage.removeItem('pawvault_dogs_data_v1');
      localStorage.removeItem('pawvault_active_dog_id');
    } catch (e) {}

    loadData();
    setupEventListeners();
    renderDogSelector();
    renderActiveDog();
    initWeightChart();

    // If no dog exists yet, automatically prompt the user to add their real dog
    if (dogsData.length === 0) {
      document.getElementById('noDogBanner').classList.remove('hidden');
    }
  }

  // Load from LocalStorage
  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dogsData = JSON.parse(stored);
      } else {
        dogsData = [];
      }
    } catch (e) {
      console.error('Error loading data from localStorage:', e);
      dogsData = [];
    }

    activeDogId = localStorage.getItem(ACTIVE_DOG_KEY);
    if (!activeDogId || !dogsData.find(d => d.id === activeDogId)) {
      activeDogId = dogsData[0]?.id || null;
      if (activeDogId) localStorage.setItem(ACTIVE_DOG_KEY, activeDogId);
    }
  }

  // Save to LocalStorage
  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dogsData));
      if (activeDogId) {
        localStorage.setItem(ACTIVE_DOG_KEY, activeDogId);
      } else {
        localStorage.removeItem(ACTIVE_DOG_KEY);
      }
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
      showToast('Error saving data! Storage might be full.', 'error');
    }
  }

  // Get active dog helper
  function getActiveDog() {
    return dogsData.find(d => d.id === activeDogId) || null;
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Dog selector change
    const dogSelector = document.getElementById('dogSelector');
    dogSelector.addEventListener('change', (e) => {
      activeDogId = e.target.value;
      localStorage.setItem(ACTIVE_DOG_KEY, activeDogId);
      renderActiveDog();
      const dog = getActiveDog();
      if (dog) showToast(`Switched profile to ${dog.name}`);
    });

    // Navigation Tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        navTabs.forEach(t => {
          t.classList.remove('active', 'border-amber-600', 'text-amber-700');
          t.classList.add('border-transparent', 'text-slate-500');
        });
        tab.classList.add('active', 'border-amber-600', 'text-amber-700');
        tab.classList.remove('border-transparent', 'text-slate-500');

        const targetTab = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-pane').forEach(pane => {
          if (pane.id === `tab-${targetTab}`) {
            pane.classList.remove('hidden');
          } else {
            pane.classList.add('hidden');
          }
        });

        if (targetTab === 'weight') {
          setTimeout(() => updateWeightChart(), 50);
        }
      });
    });

    // Avatar upload
    const avatarInput = document.getElementById('avatarUploadInput');
    avatarInput.addEventListener('change', handleAvatarUpload);

    // Add Dog Buttons
    document.getElementById('addDogBtn').addEventListener('click', () => openDogModal());
    document.getElementById('bannerAddDogBtn').addEventListener('click', () => openDogModal());

    // Edit Dog Profile Button
    document.getElementById('editDogProfileBtn').addEventListener('click', () => {
      const dog = getActiveDog();
      if (dog) {
        openDogModal(dog);
      } else {
        openDogModal();
      }
    });

    // Delete Dog Button
    document.getElementById('deleteDogBtn').addEventListener('click', handleDeleteDog);

    // Save Dog Form
    document.getElementById('dogForm').addEventListener('submit', handleSaveDog);

    // Log Vaccination
    document.getElementById('addVaccineBtn').addEventListener('click', () => {
      if (!ensureDogSelected()) return;
      openVaccineModal();
    });
    document.getElementById('vaccineForm').addEventListener('submit', handleSaveVaccine);

    // Add Medication
    document.getElementById('addMedicationBtn').addEventListener('click', () => {
      if (!ensureDogSelected()) return;
      openMedicationModal();
    });
    document.getElementById('medicationForm').addEventListener('submit', handleSaveMedication);

    // Log Vet Visit
    document.getElementById('addVisitBtn').addEventListener('click', () => {
      if (!ensureDogSelected()) return;
      openVisitModal();
    });
    document.getElementById('visitForm').addEventListener('submit', handleSaveVisit);

    // Log Weight Form
    document.getElementById('weightLogForm').addEventListener('submit', (e) => {
      if (!ensureDogSelected()) {
        e.preventDefault();
        return;
      }
      handleSaveWeight(e);
    });

    // Edit Diet Button
    document.getElementById('editDietBtn').addEventListener('click', () => {
      if (!ensureDogSelected()) return;
      openDietModal();
    });
    document.getElementById('editCareNotesBtn').addEventListener('click', () => {
      if (!ensureDogSelected()) return;
      openDietModal();
    });
    document.getElementById('dietCareForm').addEventListener('submit', handleSaveDietCare);

    // Edit Contacts Button & Quick Emergency Button
    document.getElementById('editContactsBtn').addEventListener('click', () => {
      if (!ensureDogSelected()) return;
      openContactsModal();
    });
    document.getElementById('quickEmergencyModalBtn').addEventListener('click', () => {
      if (!ensureDogSelected()) return;
      openContactsModal();
    });
    document.getElementById('contactsForm').addEventListener('submit', handleSaveContacts);

    // Primary Vet and Emergency Call button handlers
    document.getElementById('callPrimaryVetBtn').addEventListener('click', () => {
      const dog = getActiveDog();
      const phone = dog?.contacts?.primaryVetPhone;
      if (phone) {
        window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
      } else {
        showToast('No phone number saved. Click "Update Contacts" to add one.', 'error');
      }
    });
    document.getElementById('callEmergencyVetBtn').addEventListener('click', () => {
      const dog = getActiveDog();
      const phone = dog?.contacts?.emergencyVetPhone;
      if (phone) {
        window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
      } else {
        showToast('No emergency phone saved. Click "Update Contacts" to add one.', 'error');
      }
    });

    // Settings Dropdown Toggle
    const settingsBtn = document.getElementById('settingsMenuBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      settingsDropdown.classList.add('hidden');
    });

    // Backup & Export JSON
    document.getElementById('exportDataBtn').addEventListener('click', handleExportJSON);

    // Import JSON
    document.getElementById('importDataInput').addEventListener('change', handleImportJSON);

    // Clear All Data
    document.getElementById('clearAllDataBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to completely clear all dog data? This will remove all records.')) {
        dogsData = [];
        activeDogId = null;
        saveData();
        renderDogSelector();
        renderActiveDog();
        showToast('All dog records cleared.', 'error');
      }
    });

    // Close Modals
    document.querySelectorAll('.closeModalBtn').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    // Print Vet Summary Sheet Button
    document.getElementById('printVetSummaryBtn').addEventListener('click', handlePrintSummary);
  }

  function ensureDogSelected() {
    const dog = getActiveDog();
    if (!dog) {
      alert('Please add your dog\'s profile first.');
      openDogModal();
      return false;
    }
    return true;
  }

  function closeAllModals() {
    document.querySelectorAll('[id$="Modal"]').forEach(modal => modal.classList.add('hidden'));
  }

  // Render Dog Selector Dropdown
  function renderDogSelector() {
    const selector = document.getElementById('dogSelector');
    selector.innerHTML = '';
    if (dogsData.length === 0) {
      selector.innerHTML = '<option value="">No dog added yet</option>';
      return;
    }

    dogsData.forEach(dog => {
      const option = document.createElement('option');
      option.value = dog.id;
      option.textContent = dog.name;
      if (dog.id === activeDogId) option.selected = true;
      selector.appendChild(option);
    });
  }

  // Calculate age string from birthdate
  function calculateAge(birthdateStr) {
    if (!birthdateStr) return 'Unknown age';
    const birth = new Date(birthdateStr);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    const birthFormatted = birth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (years <= 0) {
      return `${months} mos (${birthFormatted})`;
    }
    return `${years} yr${years > 1 ? 's' : ''} ${months} mo${months !== 1 ? 's' : ''} (${birthFormatted})`;
  }

  // Format date helper
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  }

  // Check vaccine status
  function getDueStatus(dueDateStr) {
    if (!dueDateStr) return { label: 'Up to Date', class: 'badge-status-current', icon: 'fa-check-circle', color: 'emerald' };
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(dueDateStr);
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)}d`, class: 'badge-status-overdue', icon: 'fa-circle-exclamation', color: 'rose', isUrgent: true };
    } else if (diffDays <= 30) {
      return { label: `Due in ${diffDays}d`, class: 'badge-status-due', icon: 'fa-clock', color: 'amber', isWarning: true };
    } else {
      return { label: 'Up to Date', class: 'badge-status-current', icon: 'fa-circle-check', color: 'emerald' };
    }
  }

  // Render Active Dog Data in UI
  function renderActiveDog() {
    const dog = getActiveDog();
    const noDogBanner = document.getElementById('noDogBanner');

    if (!dog) {
      // Empty state
      noDogBanner.classList.remove('hidden');
      document.getElementById('dogName').textContent = 'No Dog Added Yet';
      document.getElementById('dogBreed').textContent = 'Click "+ Add Dog" to enter your dog\'s real details';
      document.getElementById('dogGenderBadge').textContent = '-';
      document.getElementById('dogAgeText').textContent = '-';
      document.getElementById('dogWeightText').textContent = 'No weight logged';
      document.getElementById('dogMicrochipText').textContent = 'No Microchip';
      document.getElementById('dogRabiesTagText').textContent = 'No Rabies Tag';
      document.getElementById('dogAllergiesBanner').innerHTML = '<span class="text-xs text-slate-400 italic">No dog profile active</span>';

      // Avatar
      document.getElementById('profileAvatar').classList.add('hidden');
      document.getElementById('profileAvatarPlaceholder').classList.remove('hidden');

      // Subsections
      document.getElementById('vaccinesTableBody').innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No vaccination records logged yet.</td></tr>';
      document.getElementById('medicationsGrid').innerHTML = '<div class="col-span-full py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">No medications logged yet.</div>';
      document.getElementById('visitsList').innerHTML = '<div class="py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">No vet visits recorded yet.</div>';
      document.getElementById('weightHistoryLog').innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">No weight logged yet.</p>';
      document.getElementById('remindersBanner').innerHTML = '';

      // Diet & care placeholders
      renderDietCare(null);
      renderContacts(null);

      document.getElementById('badgeVaccineCount').textContent = '0';
      document.getElementById('badgeMedCount').textContent = '0';
      document.getElementById('badgeVisitCount').textContent = '0';

      updateWeightChart();
      return;
    }

    noDogBanner.classList.add('hidden');

    // Header Info
    document.getElementById('dogName').textContent = dog.name;
    document.getElementById('dogBreed').textContent = dog.breed;
    document.getElementById('dogGenderBadge').textContent = dog.gender || 'Unknown';
    document.getElementById('dogAgeText').textContent = calculateAge(dog.birthdate);

    // Avatar
    const imgEl = document.getElementById('profileAvatar');
    const placeholderEl = document.getElementById('profileAvatarPlaceholder');
    if (dog.photo) {
      imgEl.src = dog.photo;
      imgEl.classList.remove('hidden');
      placeholderEl.classList.add('hidden');
    } else {
      imgEl.classList.add('hidden');
      placeholderEl.classList.remove('hidden');
    }

    // Latest Weight
    const latestWeight = (dog.weights && dog.weights.length > 0) ? dog.weights[dog.weights.length - 1] : null;
    if (latestWeight) {
      const kg = latestWeight.unit === 'kg' ? latestWeight.weight : (latestWeight.weight * 0.453592).toFixed(1);
      const lbs = latestWeight.unit === 'lbs' ? latestWeight.weight : (latestWeight.weight * 2.20462).toFixed(1);
      document.getElementById('dogWeightText').textContent = `${kg} kg (${lbs} lbs)`;
    } else {
      document.getElementById('dogWeightText').textContent = 'No weight logged';
    }

    // Microchip & Rabies
    document.getElementById('dogMicrochipText').textContent = dog.microchip ? `Microchip: ${dog.microchip}` : 'No Microchip';
    document.getElementById('dogRabiesTagText').textContent = dog.rabiesTag ? `Tag: ${dog.rabiesTag}` : 'No Rabies Tag';

    // Allergies
    const allergiesContainer = document.getElementById('dogAllergiesBanner');
    allergiesContainer.innerHTML = '';
    if (dog.allergies && dog.allergies.length > 0) {
      dog.allergies.forEach(allergy => {
        const span = document.createElement('span');
        span.className = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200';
        span.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1 text-[10px]"></i> Allergy: ${escapeHtml(allergy)}`;
        allergiesContainer.appendChild(span);
      });
    } else {
      allergiesContainer.innerHTML = '<span class="text-xs text-slate-400 italic"><i class="fa-solid fa-circle-check text-emerald-500 mr-1"></i>No known allergies</span>';
    }

    // Reminders Banner
    renderRemindersBanner(dog);

    // Render Sub-sections
    renderVaccines(dog);
    renderMedications(dog);
    renderVisits(dog);
    renderWeightLog(dog);
    renderDietCare(dog);
    renderContacts(dog);

    // Update Counts in Badges
    document.getElementById('badgeVaccineCount').textContent = (dog.vaccines || []).length;
    document.getElementById('badgeMedCount').textContent = (dog.medications || []).filter(m => m.active).length;
    document.getElementById('badgeVisitCount').textContent = (dog.visits || []).length;

    // Update Chart
    updateWeightChart();
  }

  // Render Reminders Banner
  function renderRemindersBanner(dog) {
    const banner = document.getElementById('remindersBanner');
    banner.innerHTML = '';
    if (!dog) return;

    const alerts = [];

    // Check vaccines
    (dog.vaccines || []).forEach(vac => {
      const status = getDueStatus(vac.dueDate);
      if (status.isUrgent) {
        alerts.push({
          type: 'danger',
          title: `Overdue Vaccine: ${vac.name}`,
          desc: `Was due on ${formatDate(vac.dueDate)}. Please consult your veterinarian for renewal.`,
          icon: 'fa-triangle-exclamation'
        });
      } else if (status.isWarning) {
        alerts.push({
          type: 'warning',
          title: `Upcoming Vaccine: ${vac.name}`,
          desc: `Scheduled renewal due on ${formatDate(vac.dueDate)} (${status.label}).`,
          icon: 'fa-clock'
        });
      }
    });

    // Check medications due
    (dog.medications || []).forEach(med => {
      if (med.active && med.nextDue) {
        const status = getDueStatus(med.nextDue);
        if (status.isUrgent || status.isWarning) {
          alerts.push({
            type: status.isUrgent ? 'danger' : 'warning',
            title: `Medication Dose Due: ${med.name}`,
            desc: `Scheduled for ${formatDate(med.nextDue)} (${med.dosage}). ${med.notes || ''}`,
            icon: 'fa-pills'
          });
        }
      }
    });

    if (alerts.length === 0) return;

    alerts.forEach(item => {
      const alertDiv = document.createElement('div');
      const isDanger = item.type === 'danger';
      alertDiv.className = `p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
        isDanger ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-900'
      }`;
      alertDiv.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="fa-solid ${item.icon} text-base ${isDanger ? 'text-rose-600' : 'text-amber-600'}"></i>
          <div>
            <strong class="font-semibold block">${escapeHtml(item.title)}</strong>
            <span class="opacity-90">${escapeHtml(item.desc)}</span>
          </div>
        </div>
      `;
      banner.appendChild(alertDiv);
    });
  }

  // Render Vaccines Table
  function renderVaccines(dog) {
    const tbody = document.getElementById('vaccinesTableBody');
    tbody.innerHTML = '';
    if (!dog) return;

    const list = dog.vaccines || [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No vaccination records logged yet. Click "Log Vaccination" above.</td></tr>`;
      return;
    }

    // Sort by due date
    const sorted = [...list].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    sorted.forEach(vac => {
      const status = getDueStatus(vac.dueDate);
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/60 transition';
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="font-semibold text-slate-900">${escapeHtml(vac.name)}</div>
          ${vac.batch ? `<div class="text-xs text-slate-400">Batch: ${escapeHtml(vac.batch)}</div>` : ''}
        </td>
        <td class="px-6 py-4 text-slate-600">${formatDate(vac.adminDate)}</td>
        <td class="px-6 py-4 font-medium ${status.isUrgent ? 'text-rose-700' : (status.isWarning ? 'text-amber-700' : 'text-slate-800')}">${formatDate(vac.dueDate)}</td>
        <td class="px-6 py-4 text-slate-600">${escapeHtml(vac.vet || '-')}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.class}">
            <i class="fa-solid ${status.icon} mr-1 text-[10px]"></i> ${status.label}
          </span>
        </td>
        <td class="px-6 py-4 text-right space-x-2">
          <button class="edit-vac-btn text-slate-400 hover:text-amber-600" data-id="${vac.id}" title="Edit"><i class="fa-solid fa-pencil"></i></button>
          <button class="delete-vac-btn text-slate-400 hover:text-rose-600" data-id="${vac.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.edit-vac-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vac = list.find(v => v.id === btn.getAttribute('data-id'));
        if (vac) openVaccineModal(vac);
      });
    });
    tbody.querySelectorAll('.delete-vac-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this vaccine record?')) {
          dog.vaccines = dog.vaccines.filter(v => v.id !== id);
          saveData();
          renderActiveDog();
          showToast('Vaccine record deleted.');
        }
      });
    });
  }

  // Render Medications Grid
  function renderMedications(dog) {
    const grid = document.getElementById('medicationsGrid');
    grid.innerHTML = '';
    if (!dog) return;

    const list = dog.medications || [];
    if (list.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">No medications or preventatives recorded yet. Click "Add Medication" above.</div>`;
      return;
    }

    list.forEach(med => {
      const card = document.createElement('div');
      card.className = `bg-white rounded-2xl p-5 shadow-sm border transition flex flex-col justify-between ${med.active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'}`;
      card.innerHTML = `
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${med.category === 'Flea / Tick / Heartworm' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}">${escapeHtml(med.category)}</span>
              <h4 class="font-bold text-slate-900 text-base mt-1.5">${escapeHtml(med.name)}</h4>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-semibold ${med.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
              ${med.active ? 'Active' : 'Past / Inactive'}
            </span>
          </div>

          <div class="space-y-1.5 text-xs text-slate-600 my-3">
            <p><strong class="text-slate-700 font-semibold">Dosage:</strong> ${escapeHtml(med.dosage)}</p>
            <p><strong class="text-slate-700 font-semibold">Frequency:</strong> ${escapeHtml(med.frequency)}</p>
            ${med.nextDue ? `<p><strong class="text-slate-700 font-semibold">Next Dose:</strong> <span class="font-medium text-amber-700">${formatDate(med.nextDue)}</span></p>` : ''}
            ${med.notes ? `<p class="mt-2 text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">${escapeHtml(med.notes)}</p>` : ''}
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-xs">
          <button class="toggle-med-btn font-medium ${med.active ? 'text-amber-700 hover:text-amber-800' : 'text-emerald-700 hover:text-emerald-800'}" data-id="${med.id}">
            ${med.active ? '<i class="fa-solid fa-pause mr-1"></i>Mark Inactive' : '<i class="fa-solid fa-play mr-1"></i>Mark Active'}
          </button>
          <div class="space-x-2">
            <button class="edit-med-btn text-slate-400 hover:text-amber-600" data-id="${med.id}"><i class="fa-solid fa-pencil"></i></button>
            <button class="delete-med-btn text-slate-400 hover:text-rose-600" data-id="${med.id}"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.toggle-med-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = list.find(m => m.id === id);
        if (item) {
          item.active = !item.active;
          saveData();
          renderActiveDog();
        }
      });
    });
    grid.querySelectorAll('.edit-med-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = list.find(m => m.id === btn.getAttribute('data-id'));
        if (item) openMedicationModal(item);
      });
    });
    grid.querySelectorAll('.delete-med-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this medication record?')) {
          dog.medications = dog.medications.filter(m => m.id !== id);
          saveData();
          renderActiveDog();
          showToast('Medication deleted.');
        }
      });
    });
  }

  // Render Vet Visits Timeline
  function renderVisits(dog) {
    const container = document.getElementById('visitsList');
    container.innerHTML = '';
    if (!dog) return;

    const list = dog.visits || [];
    if (list.length === 0) {
      container.innerHTML = `<div class="py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">No vet visit records logged yet. Click "Log Vet Visit" above.</div>`;
      return;
    }

    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(visit => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition';
      card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-stethoscope"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm sm:text-base">${escapeHtml(visit.reason)}</h4>
              <p class="text-xs text-slate-500">${escapeHtml(visit.clinic || 'Veterinary Clinic')}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3 text-xs sm:text-sm">
            <span class="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">${formatDate(visit.date)}</span>
            ${visit.cost ? `<span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">$${parseFloat(visit.cost).toFixed(2)}</span>` : ''}
            <button class="delete-visit-btn text-slate-400 hover:text-rose-600 p-1" data-id="${visit.id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>

        <div class="text-xs sm:text-sm text-slate-600 space-y-2">
          ${visit.notes ? `<p class="leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">${escapeHtml(visit.notes)}</p>` : ''}
          ${visit.followUp ? `<p class="text-xs text-amber-800 font-medium"><i class="fa-solid fa-bell mr-1.5 text-amber-500"></i><strong>Follow-up:</strong> ${escapeHtml(visit.followUp)}</p>` : ''}
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.delete-visit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this vet visit entry?')) {
          dog.visits = dog.visits.filter(v => v.id !== id);
          saveData();
          renderActiveDog();
          showToast('Visit record deleted.');
        }
      });
    });
  }

  // Weight Log List & Chart
  function renderWeightLog(dog) {
    const listContainer = document.getElementById('weightHistoryLog');
    listContainer.innerHTML = '';
    if (!dog) return;

    const weights = dog.weights || [];
    if (weights.length === 0) {
      listContainer.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">No weight entries logged yet.</p>';
      return;
    }

    const sortedDesc = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedDesc.forEach(item => {
      const row = document.createElement('div');
      row.className = 'py-2 flex items-center justify-between text-xs';
      row.innerHTML = `
        <span class="text-slate-500">${formatDate(item.date)}</span>
        <div class="flex items-center space-x-3">
          <span class="font-bold text-slate-800">${item.weight} ${item.unit}</span>
          <button class="delete-weight-btn text-slate-300 hover:text-rose-500" data-id="${item.id}" title="Delete"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
      listContainer.appendChild(row);
    });

    listContainer.querySelectorAll('.delete-weight-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        dog.weights = dog.weights.filter(w => w.id !== id);
        saveData();
        renderActiveDog();
        showToast('Weight entry removed.');
      });
    });
  }

  // Chart.js initialization & update
  function initWeightChart() {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;

    weightChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Weight (kg)',
          data: [],
          borderColor: '#d97706',
          backgroundColor: 'rgba(217, 119, 6, 0.12)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#b45309',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const kg = context.parsed.y;
                const lbs = (kg * 2.20462).toFixed(1);
                return `${kg} kg (${lbs} lbs)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: function(val) { return val + ' kg'; }
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });

    updateWeightChart();
  }

  function updateWeightChart() {
    if (!weightChartInstance) return;
    const dog = getActiveDog();
    if (!dog || !dog.weights || dog.weights.length === 0) {
      weightChartInstance.data.labels = [];
      weightChartInstance.data.datasets[0].data = [];
      weightChartInstance.update();
      return;
    }

    const sorted = [...dog.weights].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(w => formatDate(w.date));
    const dataValues = sorted.map(w => {
      return w.unit === 'lbs' ? parseFloat((w.weight * 0.453592).toFixed(2)) : parseFloat(w.weight);
    });

    weightChartInstance.data.labels = labels;
    weightChartInstance.data.datasets[0].data = dataValues;
    weightChartInstance.update();
  }

  // Render Diet & Care Tab
  function renderDietCare(dog) {
    const diet = dog?.diet || {};
    const care = dog?.care || {};

    document.getElementById('dietFoodBrand').textContent = diet.food || 'Not recorded yet';
    document.getElementById('dietPortion').textContent = diet.portion || 'Not recorded';
    document.getElementById('dietSchedule').textContent = diet.schedule || 'Not recorded';
    document.getElementById('dietTreats').textContent = diet.treats || 'None listed';

    document.getElementById('careLastBath').textContent = care.bath || 'Not recorded';
    document.getElementById('careLastNails').textContent = care.nails || 'Not recorded';
    document.getElementById('careDental').textContent = care.dental || 'Not recorded';
    document.getElementById('careBehavior').textContent = care.behavior || 'No behavioral notes added yet.';
  }

  // Render Contacts Tab
  function renderContacts(dog) {
    const c = dog?.contacts || {};
    document.getElementById('contactPrimaryVetName').textContent = c.primaryVetName || 'Not added yet';
    document.getElementById('contactPrimaryVetPhone').textContent = c.primaryVetPhone || 'No phone number';
    document.getElementById('contactPrimaryVetAddress').textContent = c.primaryVetAddress || 'No address';

    document.getElementById('contactEmergencyVetName').textContent = c.emergencyVetName || 'Not added yet';
    document.getElementById('contactEmergencyVetPhone').textContent = c.emergencyVetPhone || 'No emergency phone';
    document.getElementById('contactEmergencyVetAddress').textContent = c.emergencyVetAddress || 'No address';

    document.getElementById('contactInsuranceText').textContent = c.insuranceDetails || 'Not recorded';
  }

  // ---------------- FORM HANDLERS & MODALS ----------------

  // Dog Profile Modal
  function openDogModal(dogToEdit = null) {
    const modal = document.getElementById('dogModal');
    const title = document.getElementById('dogModalTitle');
    const deleteBtn = document.getElementById('deleteDogBtn');

    if (dogToEdit) {
      title.textContent = `Edit Profile: ${dogToEdit.name}`;
      deleteBtn.classList.remove('hidden');
      document.getElementById('formDogId').value = dogToEdit.id;
      document.getElementById('formDogName').value = dogToEdit.name;
      document.getElementById('formDogBreed').value = dogToEdit.breed;
      document.getElementById('formDogBirthdate').value = dogToEdit.birthdate;
      document.getElementById('formDogGender').value = dogToEdit.gender;
      document.getElementById('formDogMicrochip').value = dogToEdit.microchip || '';
      document.getElementById('formDogRabiesTag').value = dogToEdit.rabiesTag || '';
      document.getElementById('formDogAllergies').value = (dogToEdit.allergies || []).join(', ');
    } else {
      title.textContent = 'Add Real Dog Profile';
      deleteBtn.classList.add('hidden');
      document.getElementById('dogForm').reset();
      document.getElementById('formDogId').value = '';
      document.getElementById('formDogBirthdate').value = new Date().toISOString().split('T')[0];
    }
    modal.classList.remove('hidden');
  }

  function handleSaveDog(e) {
    e.preventDefault();
    const id = document.getElementById('formDogId').value;
    const name = document.getElementById('formDogName').value.trim();
    const breed = document.getElementById('formDogBreed').value.trim();
    const birthdate = document.getElementById('formDogBirthdate').value;
    const gender = document.getElementById('formDogGender').value;
    const microchip = document.getElementById('formDogMicrochip').value.trim();
    const rabiesTag = document.getElementById('formDogRabiesTag').value.trim();
    const allergiesStr = document.getElementById('formDogAllergies').value.trim();
    const allergies = allergiesStr ? allergiesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

    if (id) {
      const dog = dogsData.find(d => d.id === id);
      if (dog) {
        dog.name = name;
        dog.breed = breed;
        dog.birthdate = birthdate;
        dog.gender = gender;
        dog.microchip = microchip;
        dog.rabiesTag = rabiesTag;
        dog.allergies = allergies;
      }
    } else {
      const newDog = {
        id: 'dog_' + Date.now(),
        name,
        breed,
        birthdate,
        gender,
        microchip,
        rabiesTag,
        allergies,
        photo: '',
        diet: { food: '', portion: '', schedule: '', treats: '' },
        care: { bath: '', nails: '', dental: '', behavior: '' },
        contacts: {
          primaryVetName: '',
          primaryVetPhone: '',
          primaryVetAddress: '',
          emergencyVetName: '',
          emergencyVetPhone: '',
          emergencyVetAddress: '',
          insuranceDetails: ''
        },
        weights: [],
        vaccines: [],
        medications: [],
        visits: []
      };
      dogsData.push(newDog);
      activeDogId = newDog.id;
    }

    saveData();
    renderDogSelector();
    renderActiveDog();
    closeAllModals();
    showToast(`Saved dog profile for ${name}!`);
  }

  function handleDeleteDog() {
    const id = document.getElementById('formDogId').value;
    const dog = dogsData.find(d => d.id === id);
    if (!dog) return;

    if (confirm(`Are you sure you want to delete ${dog.name}'s profile and all medical records?`)) {
      dogsData = dogsData.filter(d => d.id !== id);
      activeDogId = dogsData.length > 0 ? dogsData[0].id : null;
      saveData();
      renderDogSelector();
      renderActiveDog();
      closeAllModals();
      showToast(`Deleted ${dog.name}.`, 'error');
    }
  }

  // Avatar Upload (FileReader -> DataURL in LocalStorage)
  function handleAvatarUpload(e) {
    const dog = getActiveDog();
    if (!dog) {
      alert('Please add a dog profile first before uploading a photo.');
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo is too large! Please choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
      dog.photo = evt.target.result;
      saveData();
      renderActiveDog();
      showToast('Profile photo updated!');
    };
    reader.readAsDataURL(file);
  }

  // Vaccine Modal & Save
  function openVaccineModal(vaccineToEdit = null) {
    const modal = document.getElementById('vaccineModal');
    const title = document.getElementById('vaccineModalTitle');

    if (vaccineToEdit) {
      title.textContent = 'Edit Vaccination';
      document.getElementById('formVaccineId').value = vaccineToEdit.id;
      document.getElementById('formVaccineName').value = vaccineToEdit.name;
      document.getElementById('formVaccineAdminDate').value = vaccineToEdit.adminDate;
      document.getElementById('formVaccineDueDate').value = vaccineToEdit.dueDate;
      document.getElementById('formVaccineBatch').value = vaccineToEdit.batch || '';
      document.getElementById('formVaccineVet').value = vaccineToEdit.vet || '';
    } else {
      title.textContent = 'Log Vaccination';
      document.getElementById('vaccineForm').reset();
      document.getElementById('formVaccineId').value = '';
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('formVaccineAdminDate').value = today;
    }
    modal.classList.remove('hidden');
  }

  function handleSaveVaccine(e) {
    e.preventDefault();
    const dog = getActiveDog();
    if (!dog) return;

    const id = document.getElementById('formVaccineId').value;
    const name = document.getElementById('formVaccineName').value.trim();
    const adminDate = document.getElementById('formVaccineAdminDate').value;
    const dueDate = document.getElementById('formVaccineDueDate').value;
    const batch = document.getElementById('formVaccineBatch').value.trim();
    const vet = document.getElementById('formVaccineVet').value.trim();

    if (!dog.vaccines) dog.vaccines = [];

    if (id) {
      const item = dog.vaccines.find(v => v.id === id);
      if (item) {
        item.name = name;
        item.adminDate = adminDate;
        item.dueDate = dueDate;
        item.batch = batch;
        item.vet = vet;
      }
    } else {
      dog.vaccines.push({
        id: 'vac_' + Date.now(),
        name,
        adminDate,
        dueDate,
        batch,
        vet
      });
    }

    saveData();
    renderActiveDog();
    closeAllModals();
    showToast(`Vaccination ${name} saved!`);
  }

  // Medication Modal & Save
  function openMedicationModal(medToEdit = null) {
    const modal = document.getElementById('medicationModal');
    const title = document.getElementById('medModalTitle');

    if (medToEdit) {
      title.textContent = 'Edit Medication';
      document.getElementById('formMedId').value = medToEdit.id;
      document.getElementById('formMedName').value = medToEdit.name;
      document.getElementById('formMedDosage').value = medToEdit.dosage;
      document.getElementById('formMedFrequency').value = medToEdit.frequency;
      document.getElementById('formMedCategory').value = medToEdit.category;
      document.getElementById('formMedNextDue').value = medToEdit.nextDue || '';
      document.getElementById('formMedNotes').value = medToEdit.notes || '';
      document.getElementById('formMedActive').checked = medToEdit.active !== false;
    } else {
      title.textContent = 'Add Medication / Preventative';
      document.getElementById('medicationForm').reset();
      document.getElementById('formMedId').value = '';
      document.getElementById('formMedActive').checked = true;
    }
    modal.classList.remove('hidden');
  }

  function handleSaveMedication(e) {
    e.preventDefault();
    const dog = getActiveDog();
    if (!dog) return;

    const id = document.getElementById('formMedId').value;
    const name = document.getElementById('formMedName').value.trim();
    const dosage = document.getElementById('formMedDosage').value.trim();
    const frequency = document.getElementById('formMedFrequency').value.trim();
    const category = document.getElementById('formMedCategory').value;
    const nextDue = document.getElementById('formMedNextDue').value;
    const notes = document.getElementById('formMedNotes').value.trim();
    const active = document.getElementById('formMedActive').checked;

    if (!dog.medications) dog.medications = [];

    if (id) {
      const item = dog.medications.find(m => m.id === id);
      if (item) {
        item.name = name;
        item.dosage = dosage;
        item.frequency = frequency;
        item.category = category;
        item.nextDue = nextDue;
        item.notes = notes;
        item.active = active;
      }
    } else {
      dog.medications.push({
        id: 'med_' + Date.now(),
        name,
        dosage,
        frequency,
        category,
        nextDue,
        notes,
        active
      });
    }

    saveData();
    renderActiveDog();
    closeAllModals();
    showToast(`Medication ${name} saved!`);
  }

  // Visit Modal & Save
  function openVisitModal() {
    const modal = document.getElementById('visitModal');
    document.getElementById('visitForm').reset();
    document.getElementById('formVisitId').value = '';
    document.getElementById('formVisitDate').value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
  }

  function handleSaveVisit(e) {
    e.preventDefault();
    const dog = getActiveDog();
    if (!dog) return;

    const reason = document.getElementById('formVisitReason').value.trim();
    const date = document.getElementById('formVisitDate').value;
    const clinic = document.getElementById('formVisitClinic').value.trim();
    const cost = document.getElementById('formVisitCost').value;
    const notes = document.getElementById('formVisitNotes').value.trim();
    const followUp = document.getElementById('formVisitFollowUp').value.trim();

    if (!dog.visits) dog.visits = [];

    dog.visits.push({
      id: 'vis_' + Date.now(),
      date,
      reason,
      clinic,
      cost: cost ? parseFloat(cost) : null,
      notes,
      followUp
    });

    saveData();
    renderActiveDog();
    closeAllModals();
    showToast('Vet visit logged successfully!');
  }

  // Save Weight Entry
  function handleSaveWeight(e) {
    e.preventDefault();
    const dog = getActiveDog();
    if (!dog) return;

    const val = parseFloat(document.getElementById('newWeightInput').value);
    const unit = document.getElementById('newWeightUnit').value;
    const date = document.getElementById('newWeightDate').value;

    if (isNaN(val) || !date) return;

    if (!dog.weights) dog.weights = [];
    dog.weights.push({
      id: 'w_' + Date.now(),
      date,
      weight: val,
      unit
    });

    document.getElementById('newWeightInput').value = '';
    saveData();
    renderActiveDog();
    showToast(`Logged weight: ${val} ${unit}`);
  }

  // Diet & Care Modal
  function openDietModal() {
    const dog = getActiveDog();
    if (!dog) return;
    const diet = dog.diet || {};
    const care = dog.care || {};

    document.getElementById('formDietFood').value = diet.food || '';
    document.getElementById('formDietPortion').value = diet.portion || '';
    document.getElementById('formDietTimes').value = diet.schedule || '';
    document.getElementById('formDietTreats').value = diet.treats || '';

    document.getElementById('formCareBath').value = care.bath || '';
    document.getElementById('formCareNails').value = care.nails || '';
    document.getElementById('formCareBehavior').value = care.behavior || '';

    document.getElementById('dietCareModal').classList.remove('hidden');
  }

  function handleSaveDietCare(e) {
    e.preventDefault();
    const dog = getActiveDog();
    if (!dog) return;

    dog.diet = {
      food: document.getElementById('formDietFood').value.trim(),
      portion: document.getElementById('formDietPortion').value.trim(),
      schedule: document.getElementById('formDietTimes').value.trim(),
      treats: document.getElementById('formDietTreats').value.trim()
    };

    dog.care = {
      bath: document.getElementById('formCareBath').value.trim(),
      nails: document.getElementById('formCareNails').value.trim(),
      dental: dog.care?.dental || '',
      behavior: document.getElementById('formCareBehavior').value.trim()
    };

    saveData();
    renderActiveDog();
    closeAllModals();
    showToast('Diet & daily care notes saved!');
  }

  // Contacts Modal
  function openContactsModal() {
    const dog = getActiveDog();
    if (!dog) return;
    const c = dog.contacts || {};

    document.getElementById('formPrimaryVetName').value = c.primaryVetName || '';
    document.getElementById('formPrimaryVetPhone').value = c.primaryVetPhone || '';
    document.getElementById('formPrimaryVetAddress').value = c.primaryVetAddress || '';

    document.getElementById('formEmergencyVetName').value = c.emergencyVetName || '';
    document.getElementById('formEmergencyVetPhone').value = c.emergencyVetPhone || '';
    document.getElementById('formEmergencyVetAddress').value = c.emergencyVetAddress || '';

    document.getElementById('formInsuranceDetails').value = c.insuranceDetails || '';

    document.getElementById('contactsModal').classList.remove('hidden');
  }

  function handleSaveContacts(e) {
    e.preventDefault();
    const dog = getActiveDog();
    if (!dog) return;

    dog.contacts = {
      primaryVetName: document.getElementById('formPrimaryVetName').value.trim(),
      primaryVetPhone: document.getElementById('formPrimaryVetPhone').value.trim(),
      primaryVetAddress: document.getElementById('formPrimaryVetAddress').value.trim(),
      emergencyVetName: document.getElementById('formEmergencyVetName').value.trim(),
      emergencyVetPhone: document.getElementById('formEmergencyVetPhone').value.trim(),
      emergencyVetAddress: document.getElementById('formEmergencyVetAddress').value.trim(),
      insuranceDetails: document.getElementById('formInsuranceDetails').value.trim()
    };

    saveData();
    renderActiveDog();
    closeAllModals();
    showToast('Veterinary & emergency contacts saved!');
  }

  // ---------------- BACKUP & RESTORE ----------------

  function handleExportJSON() {
    if (dogsData.length === 0) {
      alert('No dog records to export yet.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dogsData, null, 2));
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PawVault_Dog_Medical_Records_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON backup file downloaded!');
  }

  function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          dogsData = imported;
          activeDogId = dogsData[0]?.id || null;
          saveData();
          renderDogSelector();
          renderActiveDog();
          showToast('Data backup restored successfully!');
        } else {
          alert('Invalid backup file format. Expected a JSON array of dogs.');
        }
      } catch (err) {
        alert('Could not read or parse the JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ---------------- PRINT VET DOSSIER ----------------

  function handlePrintSummary() {
    const dog = getActiveDog();
    if (!dog) {
      alert('Please add a dog profile first before printing.');
      return;
    }

    const printSheet = document.getElementById('printSheet');
    const latestWeight = (dog.weights && dog.weights.length > 0) ? dog.weights[dog.weights.length - 1] : null;

    let vaccinesHtml = '';
    (dog.vaccines || []).forEach(v => {
      vaccinesHtml += `
        <tr>
          <td><strong>${escapeHtml(v.name)}</strong></td>
          <td>${formatDate(v.adminDate)}</td>
          <td>${formatDate(v.dueDate)}</td>
          <td>${escapeHtml(v.batch || '-')}</td>
          <td>${escapeHtml(v.vet || '-')}</td>
        </tr>
      `;
    });

    let medsHtml = '';
    const activeMeds = (dog.medications || []).filter(m => m.active);
    if (activeMeds.length > 0) {
      activeMeds.forEach(m => {
        medsHtml += `<li><strong>${escapeHtml(m.name)}:</strong> ${escapeHtml(m.dosage)} (${escapeHtml(m.frequency)}) - <em>${escapeHtml(m.notes || '')}</em></li>`;
      });
    } else {
      medsHtml = '<li>No current active prescriptions</li>';
    }

    printSheet.innerHTML = `
      <div style="border-bottom: 2px solid #b45309; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 24pt; font-weight: 800; color: #78350f; margin: 0;">CANINE MEDICAL & CARE DOSSIER</h1>
          <p style="font-size: 10pt; color: #6b7280; margin: 4px 0 0 0;">Generated by PawVault on ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
        </div>
        <div style="text-align: right; font-size: 10pt;">
          <strong style="color: #b45309; font-size: 14pt;">${escapeHtml(dog.name)}</strong><br>
          ${escapeHtml(dog.breed)} &bull; ${dog.gender || ''}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin-top:0; color:#374151; font-size: 12pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Dog Identification</h3>
          <p style="margin: 4px 0;"><strong>Birthdate:</strong> ${formatDate(dog.birthdate)} (${calculateAge(dog.birthdate)})</p>
          <p style="margin: 4px 0;"><strong>Microchip ID:</strong> ${escapeHtml(dog.microchip || 'None')}</p>
          <p style="margin: 4px 0;"><strong>Rabies Tag #:</strong> ${escapeHtml(dog.rabiesTag || 'None')}</p>
          <p style="margin: 4px 0;"><strong>Current Weight:</strong> ${latestWeight ? `${latestWeight.weight} ${latestWeight.unit}` : 'Not recorded'}</p>
        </div>

        <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fecaca; color: #991b1b;">
          <h3 style="margin-top:0; color:#991b1b; font-size: 12pt; border-bottom: 1px solid #fecaca; padding-bottom: 4px;">Critical Medical Warnings & Allergies</h3>
          <p style="margin: 4px 0;"><strong>Known Allergies:</strong> ${dog.allergies && dog.allergies.length > 0 ? dog.allergies.map(a => escapeHtml(a)).join(', ') : 'None Reported'}</p>
          <p style="margin: 4px 0;"><strong>Behavior / Handling:</strong> ${escapeHtml(dog.care?.behavior || 'Normal')}</p>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color:#374151; font-size: 12pt; margin-bottom: 8px;">Vaccination History & Expirations</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <thead>
            <tr style="background: #f3f4f6; text-align: left;">
              <th style="padding: 6px; border: 1px solid #e5e7eb;">Vaccine</th>
              <th style="padding: 6px; border: 1px solid #e5e7eb;">Administered</th>
              <th style="padding: 6px; border: 1px solid #e5e7eb;">Next Due</th>
              <th style="padding: 6px; border: 1px solid #e5e7eb;">Lot / Batch</th>
              <th style="padding: 6px; border: 1px solid #e5e7eb;">Provider</th>
            </tr>
          </thead>
          <tbody>
            ${vaccinesHtml || '<tr><td colspan="5">No vaccines recorded</td></tr>'}
          </tbody>
        </table>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div style="border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px;">
          <h3 style="margin-top:0; color:#374151; font-size: 12pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Current Medications & Preventatives</h3>
          <ul style="margin: 8px 0; padding-left: 20px; font-size: 10pt;">
            ${medsHtml}
          </ul>
        </div>

        <div style="border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px;">
          <h3 style="margin-top:0; color:#374151; font-size: 12pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Feeding & Daily Nutrition</h3>
          <p style="margin: 4px 0; font-size: 10pt;"><strong>Food:</strong> ${escapeHtml(dog.diet?.food || 'Standard')}</p>
          <p style="margin: 4px 0; font-size: 10pt;"><strong>Daily Portion:</strong> ${escapeHtml(dog.diet?.portion || 'Standard')}</p>
          <p style="margin: 4px 0; font-size: 10pt;"><strong>Schedule:</strong> ${escapeHtml(dog.diet?.schedule || 'Standard')}</p>
          <p style="margin: 4px 0; font-size: 10pt;"><strong>Approved Treats:</strong> ${escapeHtml(dog.diet?.treats || 'None')}</p>
        </div>
      </div>

      <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; background: #f8fafc;">
        <h3 style="margin-top:0; color:#1e293b; font-size: 12pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Emergency & Veterinary Contacts</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 9.5pt;">
          <div>
            <strong>Primary Vet:</strong><br>
            ${escapeHtml(dog.contacts?.primaryVetName || '-')}<br>
            Phone: ${escapeHtml(dog.contacts?.primaryVetPhone || '-')}<br>
            ${escapeHtml(dog.contacts?.primaryVetAddress || '')}
          </div>
          <div>
            <strong style="color: #b91c1c;">24/7 Animal ER:</strong><br>
            ${escapeHtml(dog.contacts?.emergencyVetName || '-')}<br>
            Phone: ${escapeHtml(dog.contacts?.emergencyVetPhone || '-')}<br>
            ${escapeHtml(dog.contacts?.emergencyVetAddress || '')}
          </div>
          <div>
            <strong>Insurance & Poison:</strong><br>
            ${escapeHtml(dog.contacts?.insuranceDetails || '-')}<br>
            ASPCA Poison: (888) 426-4435
          </div>
        </div>
      </div>
    `;

    window.print();
  }

  // ---------------- HELPER TOAST NOTIFICATIONS ----------------
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.className = `toast px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2.5 ${
      isError ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
    }`;
    toast.innerHTML = `
      <i class="fa-solid ${isError ? 'fa-circle-xmark' : 'fa-circle-check text-amber-400'}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // HTML escaping helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bootstrap when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
