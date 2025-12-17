## 🛡️ Intelligent Security Alert System

A custom-built security monitoring engine that actively tracks suspicious behavior patterns in real-time. Unlike standard logging, this system proactively notifies administrators of potential threats.

**Capabilities:**
| Feature | Description |
|---------|-------------|
| 🎯 **IP-Based Tracking** | Monitors failed login attempts per unique IP address in real-time |
| ⚡ **Threshold Detection** | Automatically triggers alerts after **10 failed attempts** (High Severity) |
| 🛡️ **Anti-Spam Cooldown** | Implements a **30-minute cooldown** to prevent alert fatigue during attacks |
| 🚨 **Severity Levels** | Distinguishes between **HIGH** (10+ attempts) and **CRITICAL** (20+ attempts) |
| 📧 **Rich Notifications** | Sends detailed email alerts with IP, Timestamp, and User Agent data |

**Alert Workflow:**

```

1. Hacker attempts brute-force (Fail #1... Fail #9)
2. Fail #10 reached → System flags IP as "SUSPICIOUS"
3. Cooldown Check: Last alert > 30 mins ago?
4. YES → Send "⚠️ Security Alert" Email to Admin
5. NO → Log attempt but suppress email to avoid spam

```

**Key Files:**
- `src/services/securityTracker.js` - Core tracking logic & memory storage
- `src/services/securityAlerts.service.js` - Email dispatch & formatting
- `test-real-login-attacks.js` - Simulation script for brute-force testing

---

## 📨 Zero-Friction MFA (Resend Integration)

We solved the critical "SMTP Connection Timeout" issue common in university networks by integrating the **Resend API**. This ensures 99.9% delivery rates for One-Time Passwords (OTP).

**System Advantages:**
| Feature | Benefit |
|---------|---------|
| 🚀 **High Speed** | OTPs arrive in **< 2 seconds** (vs. 2+ mins with standard SMTP) |
| 🛡️ **Network Bypass** | Uses HTTP API to bypass port 587/465 blocks on campus Wi-Fi |
| 📊 **Delivery Tracking** | Real-time status logs for every sent email |
| 🔒 **Fallback Mechanism** | System handles errors gracefully if API is unreachable |

**Delivery Flow:**

```

1. User requests Login/Signup
2. Backend generates crypto-safe 6-digit OTP
3. App connects to Resend API (HTTP POST)
4. Email delivered instantly to User Inbox
5. User enters code → Verified → JWT Issued

```

**Key Files:**
- `src/services/email.service.js` - Resend API configuration
- `EMAIL_DELIVERY_STATUS.md` - Documentation of the SMTP fix
- `.env` - API Key configuration

---

## 📝 Digital Rental Agreements

A legally binding digital workflow that allows landlords and tenants to sign lease agreements directly on their mobile devices.

**Features:**
| Feature | Description |
|---------|-------------|
| 🔏 **E-Signatures** | Canvas-based signature capture for natural signing experience |
| 📄 **PDF Automation** | Automated lease generation using **Puppeteer** headless browser |
| 🔐 **Tamper Proofing** | Signatures are hashed (SHA-256) with timestamps to prevent forgery |
| ☁️ **Secure Storage** | Signed PDFs are automatically uploaded to Cloudinary |
| 🔄 **State Management** | Tracks status: `PENDING_TENANT` → `COMPLETED` |

**Key Files:**
- `src/services/digitalAgreement.service.js` - Signature validation logic
- `src/services/pdfGeneration.service.js` - HTML-to-PDF conversion
- `test-signature-flow.js` - Verification test suite

---

## 🧠 AI Threat Intelligence (Bonus)

We integrated a dedicated Python microservice to analyze user behavior and detect anomalies that static rules might miss.

**Architecture:**
- **Microservice:** Built with **FastAPI** for high-performance inference
- **Algorithm:** **Scikit-learn** (Isolation Forest / Local Outlier Factor)
- **Communication:** Node.js Backend ↔ Python Service via REST API

**Detection Metrics:**
| Input Feature | Anomaly Trigger |
|---------------|-----------------|
| 🕒 **Login Time** | Access during unusual hours (e.g., 3 AM) |
| 🌍 **Geo-Location** | Impossible travel (e.g., Login from KL then London in 1 hr) |
| 📱 **Device Hash** | Access from a previously unknown device |

**Key Files:**
- `rentverse-ai-service/requirements.txt` - ML Dependencies (scikit-learn, pandas)
- `rentverse-ai-service/main.py` - FastAPI entry point
- `src/services/anomalyDetection.js` - Backend integration layer

---

## 👑 Security Admin Dashboard

A centralized command center for administrators to visualize threats and manage platform integrity.

**Capabilities:**
| Module | Functionality |
|--------|---------------|
| 📊 **Attack Visualization** | View spikes in failed login attempts over 24h |
| 🕵️ **Auditor View** | detailed logs of every sensitive action (who, when, IP) |
| 🚫 **Ban Management** | Manually block/unblock suspicious IP addresses |
| 🏠 **Property Moderation** | Review and approve/reject landlord listings |

**Access Control:**
- **RBAC Enforced:** Only users with `role: ADMIN` can access these routes.
- **Audit Logging:** Every admin action is recorded for accountability.

**Key Files:**
- `src/routes/admin.security.routes.js` - Security data endpoints
- `src/services/admin.service.js` - Administrative logic

---

## 📱 Mobile Application Features

Native Android application built with **Capacitor**, providing a seamless mobile experience.

**Mobile-Specific Features:**
- **Deep Linking:** Open properties directly from email links (`rentverse://property/123`)
- **Native Biometrics:** (Planned) Fingerprint login support
- **Push Notifications:** Alerts for lease updates and security warnings
- **Offline Mode:** View previously loaded property details without internet

**Key Files:**
- `android/` - Native Android project files
- `capacitor.config.ts` - Mobile build configuration

```
