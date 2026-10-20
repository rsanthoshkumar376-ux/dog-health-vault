# 🐾 PawVault — Canine Medical & Care Health Dossier

**PawVault** is a complete, private, browser-based health and medical record management application designed specifically for dog owners. It stores all medical records, vaccination schedules, medications, dietary instructions, weight tracking graphs, and emergency veterinary contacts in one clean dashboard.

---

## 🌟 Key Features for Dog Owners

### 1. 🐶 Multi-Dog Profile Hub
- **Core Identifiers**: Name, breed, age & birthdate calculator, gender, spayed/neutered status.
- **Official Records**: Microchip ID number, City/County Rabies tag number, insurance provider & policy details.
- **Custom Photo Upload**: Add custom pictures for each dog (saved locally as data URLs).
- **Multiple Dogs**: Easily switch between dogs or add new dogs at any time.

### 2. 💉 Smart Vaccination Tracker
- Record core and non-core vaccines: **Rabies, DHPP / DAP, Bordetella (Kennel Cough), Leptospirosis, Lyme**, and more.
- Track **Administered Date**, **Next Due Date**, **Batch / Lot #**, and the **Veterinarian / Clinic**.
- **Automated Alerts**: Flags overdue vaccines in red and upcoming renewals (within 30 days) in yellow.

### 3. 💊 Medications & Preventatives
- Track routine monthly preventatives (**Flea, Tick, Heartworm** like *Simparica Trio*, *NexGard*, *Heartgard*).
- Track prescription medications, dosages, frequency, and instructions (e.g., *"give with dinner"*).
- Active vs. Inactive/Past toggle for completed courses of antibiotics or seasonal medicines.

### 4. 🩺 Vet Visits & Clinical History
- Log wellness checkups, urgent clinic visits, surgeries, and dental cleanings.
- Record the **date**, **clinic / doctor**, **diagnosis**, **cost / invoice**, and **recommended follow-ups**.

### 5. 📈 Weight & Growth Curve (Interactive Chart)
- Log weight in **kg** or **lbs** with dates.
- Interactive **Chart.js** line graph showing your dog's growth trajectory and weight stability over time.

### 6. 🥣 Nutrition, Diet & Grooming Log
- **Food Brand & Formula**: Details of exact kibble, raw, or wet food brand.
- **Portion & Schedule**: Exact cup/gram measurements and feeding times (e.g., 7:30 AM & 6:30 PM).
- **Treats & Restrictions**: Safe treats vs. strictly forbidden foods and allergies.
- **Grooming Log**: Last bath, nail trim schedule, teeth cleaning routine, and behavioral notes for sitters.

### 7. 🚨 Emergency Contacts & Insurance Card
- Primary veterinary clinic contact (with one-click phone dial link).
- 24/7 Emergency Animal Hospital contact & directions.
- Direct quick-access numbers for **ASPCA Animal Poison Control** `(888) 426-4435`.
- Pet Insurance policy details.

### 8. 🖨️ One-Click Printable Vet & Dog-Sitter Dossier
- Hit the **"Vet Summary"** button to automatically generate and print a clean, professional 1-page summary to hand to a new veterinarian, boarder, or dog sitter.

### 9. 🔒 100% Private & Offline-First
- All data is stored securely in your browser's `localStorage`—no accounts, no cloud tracking, and no external databases.
- Includes **Export to JSON** and **Import from JSON** so you can back up your dog's records or transfer them across devices.

---

## 🚀 How to Launch and Use

### Option 1: Direct Browser Launch (Simplest)
1. Navigate to:
   ```
   C:\Users\Admin\.gemini\antigravity\scratch\dog-health-vault\index.html
   ```
2. Double-click `index.html` to open it in **Google Chrome**, **Microsoft Edge**, **Firefox**, or **Brave**.

### Option 2: Run via Local Web Server (Optional)
If you prefer running a local server:
```powershell
cd "C:\Users\Admin\.gemini\antigravity\scratch\dog-health-vault"
python -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.

---

## 📁 Project Structure

```
dog-health-vault/
├── index.html     # Main responsive layout, modal forms, navigation, and printable sheet
├── styles.css     # Clean styles, animations, badges, and print CSS
├── app.js         # Complete data management, Chart.js logic, backup/restore, and UI handlers
└── README.md      # User guide & documentation
```
