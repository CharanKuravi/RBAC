# Exam Security Features - Enhanced Update

## Overview
This update enhances the exam security by opening exams in a **separate isolated popup window** with additional restrictions to prevent cheating and unauthorized access.

## Key Security Improvements

### 1. **Isolated Popup Window**
- Exams now open in a dedicated popup window instead of the main browser tab
- The popup is configured with:
  - No toolbar, menubar, or location bar
  - Fullscreen dimensions
  - Non-resizable window
  - Isolated from the parent window context

### 2. **Keyboard Shortcut Blocking**
The following keyboard shortcuts are blocked and monitored:

#### Blocked Shortcuts (Violations Recorded):
- **Alt + G**: Blocks access to Gemini LLM or other AI assistants
- **Print Screen**: Prevents screenshot attempts
- Any attempt triggers a violation warning

#### Silently Blocked Shortcuts:
- **Ctrl/Cmd + C, V, U, S, A, P, W, T, N**: Copy, paste, view source, save, select all, print, new window, new tab
- **F12, F5, F11**: Developer tools, refresh, fullscreen toggle
- **Alt + Tab, Alt + F4**: Window switching and closing
- **Windows/Meta Key**: System-level shortcuts
- **Escape**: Prevents exiting fullscreen
- **Right-click, Copy, Paste**: Context menu and clipboard operations

### 3. **Fullscreen Enforcement**
- Mandatory fullscreen mode throughout the exam
- Exiting fullscreen triggers a violation
- "Re-enter Fullscreen" overlay appears if student exits
- Each exit is logged and counted

### 4. **Tab Switching & Window Focus Detection**
- Detects when student switches tabs or minimizes the window
- Monitors window blur events (losing focus)
- Each occurrence is recorded as a violation

### 5. **Violation System**
- **Maximum violations**: 5 (configurable via `MAX_VIOLATIONS`)
- Each violation is:
  - Logged to the backend with event type and description
  - Displayed as a toast notification to the student
  - Counted in real-time on the exam header
- Upon reaching maximum violations:
  - Exam is automatically submitted
  - Warning notification appears 2 seconds before auto-submission

### 6. **Browser Navigation Control**
- Back/forward navigation is blocked
- Page refresh attempts are prevented
- Closing the window triggers a confirmation dialog
- All attempts are logged as violations

### 7. **Popup Window Management**
- Parent dashboard monitors if exam window is closed
- Dashboard refreshes automatically after exam window closes
- Popup automatically closes 5 seconds after exam submission
- Manual close button available on submission screen

## User Experience Flow

### Starting an Exam:
1. Student clicks "Take Exam" button on dashboard
2. Popup window opens with exam interface
3. Preflight screen shows security rules
4. Student acknowledges and enters fullscreen mode
5. Exam begins in secure, isolated environment

### During Exam:
- Student sees "Secure Mode" badge in header
- Violation counter shows current violations
- Timer counts down remaining time
- All security restrictions are active

### After Submission:
- Exam results displayed
- Total violations shown
- Popup closes automatically after 5 seconds
- Dashboard refreshes to show updated status

## Technical Implementation

### StudentDashboard.jsx Changes:
```javascript
const openExamPopup = (testId) => {
  const examWindow = window.open(
    `/exam?testId=${testId}&popup=true`,
    'ExamWindow',
    'width=fullscreen,height=fullscreen,toolbar=no,menubar=no...'
  )
  
  // Monitor window closure and refresh dashboard
}
```

### ExamClient.jsx Enhancements:
- `isPopup` flag from URL parameter
- Enhanced keyboard event blocking with Alt+G detection
- Print Screen detection
- Windows/Meta key blocking
- Auto-close logic after submission
- Conditional UI elements for popup mode

## Security Event Types Logged:
- `fullscreen_exit`: Student exited fullscreen
- `tab_switch`: Student switched tabs
- `window_blur`: Exam window lost focus
- `shortcut_blocked`: Attempted to use Alt+G or other blocked shortcuts
- `screenshot_attempt`: Attempted to use Print Screen
- `close_attempt`: Attempted to close or refresh
- `window_close_attempt`: Attempted to close popup window

## Configuration

### Adjusting Violation Threshold:
Edit `ExamClient.jsx`:
```javascript
const MAX_VIOLATIONS = 5  // Change this value
```

### Customizing Popup Dimensions:
Edit `StudentDashboard.jsx` in the `openExamPopup` function to adjust window size and features.

## Browser Compatibility
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ⚠️ Safari: Limited support (some keyboard shortcuts may not be fully blocked)
- ❌ Mobile browsers: Not recommended (popup restrictions vary)

## Admin Monitoring
All violations are logged to the backend via the `/exam/log-malpractice` endpoint with:
- Event type
- Description
- Paper/Test ID
- Student information
- Timestamp

Administrators can review violations in the audit logs and take appropriate action.

## Important Notes
1. **Popup Blockers**: Students must allow popups for the exam site
2. **Browser Permissions**: Some security features may require specific browser permissions
3. **Screen Sharing Detection**: While Alt+G is blocked, advanced screen recording software running at OS level cannot be fully prevented by browser-based security
4. **Multiple Monitors**: Students using multiple monitors can still view other content on secondary displays

## Future Enhancements (Recommendations)
1. **Camera Monitoring**: Integration with webcam proctoring
2. **Eye Tracking**: Monitor student gaze patterns
3. **Browser Extension Detection**: Detect and block potentially cheating extensions
4. **Network Monitoring**: Detect unusual network activity
5. **AI-based Behavior Analysis**: Detect suspicious patterns in student behavior
6. **Mobile App**: Native mobile app with enhanced security for phone/tablet exams

## Testing the Security Features
1. Open dashboard and click "Take Exam"
2. Verify popup opens in fullscreen
3. Try pressing Alt+G → Should be blocked with violation
4. Try Print Screen → Should be blocked with violation
5. Exit fullscreen → Should show warning overlay
6. Try Alt+Tab (if possible) → Should log violation
7. Submit exam → Window should auto-close after 5 seconds

---

**Last Updated**: October 2026  
**Version**: 2.1.0  
**Contact**: System Administrator for support
