# Quick Reference Guide - Admin Portal Code

## 📁 Project Structure

```
adminwebsite/
├── src/
│   ├── components/          # All React components
│   │   ├── adminpanel/      # Main admin layout
│   │   ├── Chat/            # Chat functionality
│   │   ├── Dashboard/       # Dashboard stats
│   │   ├── Enquiries/       # Enquiry management
│   │   ├── FollowUps/       # Follow-up management
│   │   ├── Home/            # Landing page
│   │   ├── Login/           # Authentication
│   │   ├── Notification/    # Notifications
│   │   ├── Settings/        # User settings
│   │   ├── Sidebar/         # Navigation
│   │   ├── StaffManagement/ # Admin staff management
│   │   └── Students/        # Student applications
│   ├── services/            # API service layer (NEW!)
│   │   ├── api.js          # Axios configuration
│   │   ├── staffService.js
│   │   ├── studentService.js
│   │   ├── enquiryService.js
│   │   ├── chatService.js
│   │   ├── notificationService.js
│   │   ├── dashboardService.js
│   │   └── index.js        # Central exports
│   ├── utils/               # Utilities
│   │   └── cropUtils.js    # Image cropping
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                     # Environment variables (NEW!)
├── .env.example            # Environment template (NEW!)
├── vite.config.js          # Vite configuration
├── package.json
├── AUDIT_REPORT.md         # Full audit (NEW!)
└── FIXES_APPLIED.md        # Applied fixes (NEW!)
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────┐
│          React Components                     │
│  (Settings, Chat, Students, Enquiries, etc) │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│        Service Layer (services/)             │
│  - staffService     - chatService           │
│  - studentService   - notificationService   │
│  - enquiryService   - dashboardService      │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│       Axios Instance (api.js)                │
│  - Request interceptors (add auth)          │
│  - Response interceptors (handle errors)    │
│  - Global error handling                    │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│    Vite Proxy Configuration                  │
│    /api → http://127.0.0.1:8000            │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│    Django Backend API Server                 │
│    http://127.0.0.1:8000                    │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│         Database (Unknown Type)              │
│    (SQLite/PostgreSQL/MySQL)                │
└─────────────────────────────────────────────┘
```

---

## 🚀 How to Use Services (NEW!)

### Import Services
```javascript
import { staffService, studentService, chatService } from '@/services';

// Or import individual service
import staffService from '@/services/staffService';
```

### Use in Components
```javascript
import { staffService } from '@/services';

const fetchStaff = async () => {
  try {
    const { data } = await staffService.getAll();
    setStaffList(data);
  } catch (error) {
    // Error automatically handled by interceptors
    showToast('Failed to load staff', 'danger');
  }
};
```

### Available Services

#### staffService
```javascript
staffService.getAll()                    // Get all staff
staffService.getById(id)                 // Get single staff
staffService.create(data)                // Create new
staffService.update(id, data)            // Update
staffService.delete(id)                  // Delete
staffService.login(credentials)          // Login
staffService.getDocuments(staffId)       // Get documents
staffService.uploadDocument(staffId, formData) // Upload
```

#### studentService
```javascript
studentService.getAll(filters)           // Get all students
studentService.getById(id)               // Get single
studentService.create(data)              // Create
studentService.update(id, data)          // Update
studentService.delete(id)                // Delete
studentService.markAsRead(id)            // Mark read
studentService.getByStaff(staffId)       // Get assigned
```

#### enquiryService
```javascript
enquiryService.getAll(filters)           // Get all
enquiryService.getById(id)               // Get single
enquiryService.create(data)              // Create
enquiryService.update(id, data)          // Update
enquiryService.delete(id)                // Delete
enquiryService.markAsRead(id)            // Mark read
enquiryService.getByStaff(staffId)       // Get assigned
```

#### chatService
```javascript
chatService.getUsers(params)             // Get chat users
chatService.getMessages(userId)          // Get messages
chatService.sendMessage(data)            // Send message
chatService.getUnreadCount(userId)       // Get unread count
chatService.markAsRead(chatId)           // Mark read
chatService.clearChat(chatId, scope)     // Clear chat
```

#### notificationService
```javascript
notificationService.getAll(filters)      // Get all
notificationService.getById(id)          // Get single
notificationService.create(data)         // Create/send
notificationService.update(id, data)     // Update
notificationService.markAsRead(id)       // Mark read
notificationService.delete(id)           // Delete
notificationService.getUnreadCount(userId) // Get count
```

#### dashboardService
```javascript
dashboardService.getStats(filters)       // Get dashboard data
```

---

## 🔧 Environment Variables

### Available Variables
```env
VITE_API_BASE_URL=http://127.0.0.1:8000  # Backend API URL
VITE_ENV=development                      # Environment mode
VITE_ENABLE_LOGGING=true                 # Enable logging
VITE_ENABLE_ERROR_TRACKING=false         # Error tracking
VITE_API_TIMEOUT=10000                   # API timeout in ms
```

### Usage in Code
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.VITE_ENV === 'development';
const timeout = import.meta.env.VITE_API_TIMEOUT;
```

---

## 🔐 Authentication Flow

1. **Login** → `staffService.login({login_id, password})`
2. **Store Auth** → localStorage: `staff_id`, `role`, `staff_name`, etc.
3. **Auto-inject** → Request interceptor adds `X-Staff-ID` header
4. **Verify** → Backend validates and returns user data
5. **Redirect** → Navigate to `/portal/dashboard`
6. **Logout** → Clear localStorage and redirect to `/login`

### Automatic 401 Handling
```javascript
// In api.js interceptor:
if (error.response?.status === 401) {
  localStorage.removeItem('staff_id');
  localStorage.removeItem('role');
  window.location.href = '/login';
}
```

---

## 🐛 Common Issues & Solutions

### Issue: API calls fail
**Check:**
1. Is backend running? `http://127.0.0.1:8000`
2. Are endpoints correct? Check `vite.config.js` proxy
3. Check browser console for errors
4. Check `.env` file configuration

### Issue: Images don't load
**Check:**
1. Image size < 2MB
2. Image format: JPG, PNG, GIF
3. localStorage not full (5MB limit)

### Issue: localStorage errors
**Solution:**
```javascript
try {
  localStorage.setItem('key', 'value');
} catch (e) {
  console.warn('localStorage full', e);
  // Use IndexedDB as fallback
}
```

### Issue: Polling too aggressive
**Current intervals:**
- Chat messages: 3 seconds ❌ (too fast)
- Chat users: 10 seconds ⚠️ (OK)
- Notifications: 15 seconds ✅ (good)
- Chat count: 5 seconds ❌ (too fast)

**Recommended:** 15-30 seconds or WebSocket

---

## 📊 Component Size Reference

| Component | Size | Status | Action |
|-----------|------|--------|--------|
| StaffManagement.jsx | 1557L | 🔴 TOO LARGE | Split into 5 files |
| Chat.jsx | 745L | 🟠 LARGE | Split into 3 files |
| Enquiries.jsx | 675L | 🟠 LARGE | Split into 3 files |
| Students.jsx | 614L | 🟠 LARGE | Split into 3 files |
| FollowUps.jsx | 410L | 🟡 MEDIUM | OK for now |
| Settings.jsx | 323L | 🟡 MEDIUM | OK for now |
| AdminPanel.jsx | 264L | 🟢 GOOD | No action |
| EditProfilePage.jsx | 278L | 🟢 GOOD | No action |
| EditProfileModal.jsx | 294L | 🔴 ORPHANED | DELETE |
| Dashboard.jsx | 125L | 🟢 GOOD | No action |
| Login.jsx | 119L | 🟢 GOOD | No action |
| Home.jsx | 45L | 🟢 GOOD | No action |

---

## ⚡ Performance Tips

1. **Use Memoization**
   ```javascript
   import { useMemo, React.memo } from 'react';
   const Component = React.memo(({ data }) => { ... });
   ```

2. **Debounce Search**
   ```javascript
   import debounce from 'lodash.debounce';
   const handleSearch = debounce((query) => {...}, 300);
   ```

3. **Lazy Load Routes**
   ```javascript
   const StaffManagement = lazy(() => import('./StaffManagement'));
   ```

4. **Optimize Polling**
   ```javascript
   // Increase interval
   setInterval(fetchData, 30000); // 30 seconds
   ```

---

## 📚 Related Documents

- 📄 [AUDIT_REPORT.md](AUDIT_REPORT.md) - Full audit with all issues
- 📄 [FIXES_APPLIED.md](FIXES_APPLIED.md) - Detailed fixes applied
- 📄 [.env.example](.env.example) - Environment configuration template

---

## 🎯 Todo Checklist

### Immediate (Today)
- [x] Remove unused imports
- [x] Create services layer
- [x] Set up environment variables
- [ ] Test services in development
- [ ] Delete EditProfileModal.jsx

### This Week
- [ ] Replace hardcoded URLs
- [ ] Fix localStorage keys
- [ ] Add PropTypes validation
- [ ] Add Error Boundary

### This Month
- [ ] Split large components
- [ ] Reduce polling intervals
- [ ] Add logging system
- [ ] Add unit tests

---

**Last Updated:** 2026-01-21  
**Status:** Services layer ready for use  
**Next Step:** Replace hardcoded URLs with services
