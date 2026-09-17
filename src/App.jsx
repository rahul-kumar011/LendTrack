import { useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import "./App.css";

/* =========================================================
   APP
========================================================= */

function App() {
  const SESSION_MARKER = "lendtrack_session_active";

  /* ================= AUTH ================= */

  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [verificationPending, setVerificationPending] = useState(false);
  const [handlingVerificationLink, setHandlingVerificationLink] = useState(false);

  /* ================= FORGOT PASSWORD ================= */

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  /* ================= ADD PERSON ================= */

  const [showAddPerson, setShowAddPerson] = useState(false);

  const [personName, setPersonName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [dateGiven, setDateGiven] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= ADD LOAN ================= */

  const [showAddLoan, setShowAddLoan] = useState(false);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanDate, setLoanDate] = useState("");
  const [loanInterest, setLoanInterest] = useState("");
  const [loanNote, setLoanNote] = useState("");
  const [savingLoan, setSavingLoan] = useState(false);

  /* ================= PAYMENT ================= */

  const [showPayment, setShowPayment] = useState(false);

  // Default = Interest
  const [paymentType, setPaymentType] = useState("INTEREST");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  /* ================= PEOPLE ================= */

  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("alphabetical");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [totalGiven, setTotalGiven] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalInterestPaid, setTotalInterestPaid] = useState(0);

  // Dashboard balance visibility (hidden by default)
  const [showDashboardBalances, setShowDashboardBalances] = useState(false);

  /* ================= DETAILS ================= */

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  /* ================= EDIT ================= */

  const [showEditPerson, setShowEditPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [editPersonName, setEditPersonName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [savingPersonEdit, setSavingPersonEdit] = useState(false);

  const [showEditLoan, setShowEditLoan] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [editLoanAmount, setEditLoanAmount] = useState("");
  const [editLoanDate, setEditLoanDate] = useState("");
  const [editLoanInterest, setEditLoanInterest] = useState("");
  const [editLoanNote, setEditLoanNote] = useState("");
  const [savingLoanEdit, setSavingLoanEdit] = useState(false);

  const [showEditPayment, setShowEditPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentNote, setEditPaymentNote] = useState("");
  const [savingPaymentEdit, setSavingPaymentEdit] = useState(false);

  /* ================= RECENTLY DELETED ================= */

  const [deletedItems, setDeletedItems] = useState([]);
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

  /* ================= CUSTOMER STATEMENT ================= */

  const [showStatement, setShowStatement] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [printingStatement, setPrintingStatement] = useState(false);

  /* ================= USER PROFILE ================= */

  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("lendtrack-theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("lendtrack-language") || "English");

  const hindiTranslations = {
    'Profile & Settings': 'प्रोफ़ाइल और सेटिंग्स',
    'Logout': 'लॉग आउट',
    '← Back to Dashboard': '← डैशबोर्ड पर वापस जाएँ',
    'Personal Information': 'व्यक्तिगत जानकारी',
    'Manage your basic profile details': 'अपनी प्रोफ़ाइल की मूल जानकारी प्रबंधित करें',
    'Name': 'नाम',
    'Email': 'ईमेल',
    'Phone Number': 'फ़ोन नंबर',
    'Address': 'पता',
    'Enter customer address': 'ग्राहक का पता दर्ज करें',
    'Search by name, phone or address': 'नाम, फोन या पता से खोजें',
    'No address': 'पता नहीं है',
    'Enter your name': 'अपना नाम दर्ज करें',
    'Enter phone number (optional)': 'फ़ोन नंबर दर्ज करें (वैकल्पिक)',
    'Saving...': 'सहेजा जा रहा है...',
    'Save Changes': 'परिवर्तन सहेजें',
    'Security': 'सुरक्षा',
    'Keep your account password secure': 'अपने अकाउंट के पासवर्ड को सुरक्षित रखें',
    'Change Password': 'पासवर्ड बदलें',
    'App Settings': 'ऐप सेटिंग्स',
    'Customize how LendTrack looks': 'LendTrack का रूप अपनी पसंद के अनुसार बदलें',
    'Theme': 'थीम',
    'Choose your preferred appearance': 'अपनी पसंद का रूप चुनें',
    'Light': 'लाइट',
    'Dark': 'डार्क',
    'Language': 'भाषा',
    'App language preference': 'ऐप की भाषा चुनें',
    'English': 'अंग्रेज़ी',
    'Hindi': 'हिंदी',
    'About LendTrack': 'LendTrack के बारे में',
    'A little about this app': 'इस ऐप के बारे में थोड़ी जानकारी',
    'About the App': 'ऐप के बारे में',
    'LendTrack is a simple lending management app for managing customers, loans, payments, interest and statements in one place.': 'LendTrack एक सरल लोन मैनेजमेंट ऐप है, जिसमें ग्राहक, लोन, भुगतान, ब्याज और स्टेटमेंट एक ही जगह प्रबंधित किए जा सकते हैं।',
    'Created By': 'बनाने वाला',
    'LendTrack was created and developed by the app owner/developer.': 'LendTrack को ऐप के मालिक/डेवलपर ने बनाया और विकसित किया है।',
    'Designed & Developed by Rahul Kumar': 'राहुल कुमार द्वारा डिज़ाइन और विकसित',
    'Connect with me on LinkedIn': 'LinkedIn पर मुझसे जुड़ें',
    'Current Password': 'वर्तमान पासवर्ड',
    'New Password': 'नया पासवर्ड',
    'Confirm New Password': 'नए पासवर्ड की पुष्टि करें',
    'Manage your lending easily': 'अपने लोन को आसानी से प्रबंधित करें',
    '← Back to Loans': '← लोन पर वापस जाएँ',
    '✏️ Edit Loan': '✏️ लोन संपादित करें',
    '🗑️ Delete': '🗑️ हटाएँ',
    '💳 Record Payment': '💳 भुगतान दर्ज करें',
    'Original Principal': 'मूल मूलधन',
    'Principal Paid': 'भुगतान किया गया मूलधन',
    'Present Principal': 'वर्तमान मूलधन',
    'Interest Remaining': 'बकाया ब्याज',
    'Principal Status': 'मूलधन की स्थिति',
    '− Principal Paid': '− भुगतान किया गया मूलधन',
    'Interest Summary': 'ब्याज सारांश',
    'This Month Interest': 'इस महीने का ब्याज',
    'Total Interest Due': 'कुल बकाया ब्याज',
    'Interest Paid': 'भुगतान किया गया ब्याज',
    'Interest Paid Till': 'ब्याज भुगतान यहाँ तक',
    'This Month Remaining': 'इस महीने का बाकी',
    'Month-wise Interest': 'महीने के अनुसार ब्याज',
    'Oldest unpaid interest is adjusted first.': 'सबसे पुराने बकाया ब्याज का भुगतान पहले समायोजित किया जाता है।',
    'No interest calculated.': 'कोई ब्याज नहीं निकाला गया।',
    'Due': 'बकाया',
    'Paid': 'भुगतान',
    'Remaining': 'बाकी',
    '✓ Paid': '✓ भुगतान हो गया',
    'Loan Information': 'लोन की जानकारी',
    'Amount Given': 'दी गई राशि',
    'Date Given': 'देने की तारीख',
    'Interest Rate': 'ब्याज दर',
    'Note:': 'नोट:',
    'Transaction History': 'लेन-देन का इतिहास',
    'Latest transaction first': 'नवीनतम लेन-देन पहले',
    'Loading transactions...': 'लेन-देन लोड हो रहे हैं...',
    'Principal': 'मूलधन',
    'No principal transactions.': 'कोई मूलधन लेन-देन नहीं है।',
    'Interest': 'ब्याज',
    'No interest transactions.': 'कोई ब्याज लेन-देन नहीं है।',
    'Adjusted to:': 'समायोजित राशि:',
    'Record Payment': 'भुगतान दर्ज करें',
    'Payment Type': 'भुगतान का प्रकार',
    'Both': 'दोनों',
    'Payment Date': 'भुगतान की तारीख',
    'Note (optional)': 'नोट (वैकल्पिक)',
    'Payment Amount': 'भुगतान राशि',
    'Customer Statement': 'ग्राहक स्टेटमेंट',
    '📄 PDF Export': '📄 PDF निर्यात',
    '← Back': '← वापस',
    'Complete lending and payment statement': 'लोन और भुगतान का पूरा स्टेटमेंट',
    'Total Given': 'कुल दी गई राशि',
    'Outstanding': 'बकाया मूलधन',
    'Interest Due': 'बकाया ब्याज',
    'Loan Summary': 'लोन सारांश',
    'No loans found.': 'कोई लोन नहीं मिला।',
    'Total Interest': 'कुल ब्याज',
    'No transactions.': 'कोई लेन-देन नहीं है।',
    'Date': 'तारीख',
    'Transaction': 'लेन-देन',
    'Note': 'नोट',
    'Amount': 'राशि',
    '← Back to Customers': '← ग्राहकों पर वापस जाएँ',
    '🧾 Statement': '🧾 स्टेटमेंट',
    '✏️ Edit': '✏️ संपादित करें',
    'Loans': 'लोन',
    '+ Add Loan': '+ लोन जोड़ें',
    'No loans yet': 'अभी कोई लोन नहीं है',
    'Add a loan for this customer.': 'इस ग्राहक के लिए एक लोन जोड़ें।',
    'Original': 'मूल',
    'Add New Loan': 'नया लोन जोड़ें',
    'Loan Amount': 'लोन राशि',
    'Monthly Interest Rate (%)': 'मासिक ब्याज दर (%)',
    'Edit Customer': 'ग्राहक संपादित करें',
    'Phone': 'फ़ोन',
    'Edit Loan': 'लोन संपादित करें',
    'Recently Deleted': 'हाल ही में हटाए गए',
    'Loading deleted items...': 'हटाए गए आइटम लोड हो रहे हैं...',
    'Please wait a moment.': 'कृपया कुछ क्षण प्रतीक्षा करें।',
    'Recently Deleted is empty': 'हाल ही में हटाए गए आइटम खाली हैं',
    'Deleted customers, loans and payments will appear here.': 'हटाए गए ग्राहक, लोन और भुगतान यहाँ दिखाई देंगे।',
    '↩ Restore': '↩ पुनर्स्थापित करें',
    '🗑️ Delete Permanently': '🗑️ स्थायी रूप से हटाएँ',
    'Welcome back 👋': 'वापसी पर स्वागत है 👋',
    'Total Received': 'कुल प्राप्त राशि',
    'Customers': 'ग्राहक',
    '+ Add Person': '+ व्यक्ति जोड़ें',
    'No customers yet': 'अभी कोई ग्राहक नहीं है',
    'No customer found': 'कोई ग्राहक नहीं मिला',
    'Add your first customer to start tracking loans.': 'लोन ट्रैक करना शुरू करने के लिए अपना पहला ग्राहक जोड़ें।',
    'Try another name, phone number or address.': 'कोई दूसरा नाम या फ़ोन नंबर आज़माएँ।',
    'No phone number': 'फ़ोन नंबर नहीं है',
    'loan': 'लोन',
    'loans': 'लोन',
    'Interest Due ': 'बकाया ब्याज ',
    '✓ No Dues': '✓ कोई बकाया नहीं',
    'Add Person': 'व्यक्ति जोड़ें',
    'First Loan': 'पहला लोन',
    'Customer name': 'ग्राहक का नाम',
    'Phone number': 'फ़ोन नंबर',
    'Enter amount': 'राशि दर्ज करें',
    'e.g. 3': 'जैसे 3',
    'Optional note': 'वैकल्पिक नोट',
  };

  useEffect(() => {
    const reverseTranslations = Object.fromEntries(
      Object.entries(hindiTranslations).map(([english, hindi]) => [hindi, english])
    );

    const translations =
      language === "Hindi" ? hindiTranslations : reverseTranslations;

    const applyTranslations = () => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );

      const textNodes = [];
      let node;

      while ((node = walker.nextNode())) {
        if (
          node.parentElement &&
          !node.parentElement.closest("script, style")
        ) {
          textNodes.push(node);
        }
      }

      textNodes.forEach((textNode) => {
        const original = textNode.nodeValue || "";
        const trimmed = original.trim();

        if (!trimmed || !translations[trimmed]) return;

        const startSpace = original.match(/^\\s*/)?.[0] || "";
        const endSpace = original.match(/\\s*$/)?.[0] || "";

        textNode.nodeValue =
          startSpace + translations[trimmed] + endSpace;
      });

      document
        .querySelectorAll("input[placeholder], button[title], button[aria-label]")
        .forEach((element) => {
          ["placeholder", "title", "aria-label"].forEach((attribute) => {
            if (!element.hasAttribute(attribute)) return;

            const value = element.getAttribute(attribute);
            if (translations[value]) {
              element.setAttribute(attribute, translations[value]);
            }
          });
        });
    };

    applyTranslations();

    const observer = new MutationObserver(() => {
      applyTranslations();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language]);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  /* =========================================================
     HELPER FUNCTIONS
  ========================================================= */

  function money(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  }

  function todayDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /*
    IMPORTANT:
    Date ko local timezone me banayenge.
    toISOString() use nahi karenge.
    Isi se 14 July ko 13 July hone wala bug fix hota hai.
  */

  function makeLocalDate(dateString) {
    const [year, month, day] = dateString
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  function formatDate(dateString) {
    if (!dateString) return "-";

    const date = makeLocalDate(dateString);

    return date.toLocaleDateString(language === "Hindi" ? "hi-IN" : "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function monthLabel(date) {
    return date.toLocaleDateString(language === "Hindi" ? "hi-IN" : "en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /* =========================================================
     INTEREST CALCULATION
  ========================================================= */

  function calculateInterest(
    loan,
    loanTransactions = [],
    uptoDate = new Date()
  ) {
    const originalPrincipal = Number(
      loan.amountGiven || 0
    );

    const monthlyRate = Number(
      loan.interestRate || 0
    );

    if (
      !loan.dateGiven ||
      monthlyRate <= 0
    ) {
      return {
        months: [],
        payments: [],
        totalDue: 0,
        thisMonth: 0,
        thisMonthPaid: 0,
        thisMonthRemaining: 0,
        paid: 0,
        remaining: 0,
        paidTill: null,
      };
    }

    const loanDate = makeLocalDate(
      loan.dateGiven
    );

    const today =
      uptoDate instanceof Date
        ? new Date(uptoDate)
        : makeLocalDate(uptoDate);

    /* ================= PRINCIPAL PAYMENTS ================= */

    const principalPayments =
      loanTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "PRINCIPAL_PAYMENT"
        )
        .map((transaction) => ({
          amount: Number(
            transaction.amount || 0
          ),
          date:
            transaction.date ||
            loan.dateGiven,
        }))
        .sort((a, b) =>
          a.date.localeCompare(b.date)
        );

    /* ================= INTEREST PAYMENTS ================= */

    const interestPayments =
      loanTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "INTEREST_PAYMENT"
        )
        .map((transaction) => ({
          id: transaction.id,
          amount: Number(
            transaction.amount || 0
          ),
          date:
            transaction.date ||
            loan.dateGiven,
          note:
            transaction.note || "",
        }))
        .sort((a, b) =>
          a.date.localeCompare(b.date)
        );

    /* =====================================================
       CREATE MONTHLY CYCLES

       Example:

       Loan = 14 July

       July cycle:
       14 July → 13 August

       August cycle:
       14 August → 13 September

       September cycle:
       14 September → 13 October
    ===================================================== */

    const months = [];

    let cycleStart = new Date(
      loanDate
    );

    while (
      cycleStart <= today
    ) {
      const cycleEnd = new Date(
        cycleStart
      );

      /*
        Add one month.
      */
      cycleEnd.setMonth(
        cycleEnd.getMonth() + 1
      );

      /*
        One day before next cycle.
      */
      cycleEnd.setDate(
        cycleEnd.getDate() - 1
      );

      /* ================= PRINCIPAL FOR THIS CYCLE ================= */

      let principalForCycle =
        originalPrincipal;

      /*
        Principal paid BEFORE the cycle starts
        affects this cycle.

        Principal paid DURING this cycle
        affects NEXT cycle.
      */

      principalPayments.forEach(
        (payment) => {
          const paymentDate =
            makeLocalDate(
              payment.date
            );

          if (
            paymentDate <
            cycleStart
          ) {
            principalForCycle =
              Math.max(
                principalForCycle -
                  payment.amount,
                0
              );
          }
        }
      );

      const interest =
        principalForCycle *
        (monthlyRate / 100);

      months.push({
        key:
          localDateString(
            cycleStart
          ),

        label:
          monthLabel(
            cycleStart
          ),

        startDate:
          localDateString(
            cycleStart
          ),

        endDate:
          localDateString(
            cycleEnd
          ),

        principal:
          principalForCycle,

        rate:
          monthlyRate,

        interest,

        paid: 0,

        remaining:
          interest,
      });

      /* NEXT CYCLE */

      cycleStart =
        new Date(cycleStart);

      cycleStart.setMonth(
        cycleStart.getMonth() + 1
      );
    }

    /* =====================================================
       APPLY INTEREST PAYMENTS

       Oldest unpaid interest first.
    ===================================================== */

    const paymentAllocations = [];

    for (
      const payment of interestPayments
    ) {
      let remainingPayment =
        payment.amount;

      const allocations = [];

      for (
        const monthData of months
      ) {
        if (
          remainingPayment <= 0
        ) {
          break;
        }

        const unpaid =
          Math.max(
            monthData.interest -
              monthData.paid,
            0
          );

        if (
          unpaid <= 0
        ) {
          continue;
        }

        const amountToApply =
          Math.min(
            remainingPayment,
            unpaid
          );

        monthData.paid +=
          amountToApply;

        monthData.remaining =
          Math.max(
            monthData.interest -
              monthData.paid,
            0
          );

        allocations.push({
          monthKey:
            monthData.key,

          monthLabel:
            monthData.label,

          amount:
            amountToApply,
        });

        remainingPayment -=
          amountToApply;
      }

      paymentAllocations.push({
        id:
          payment.id,

        date:
          payment.date,

        amount:
          payment.amount,

        note:
          payment.note,

        allocations,

        unallocated:
          remainingPayment,
      });
    }

    /* ================= TOTALS ================= */

    const totalDue =
      months.reduce(
        (sum, item) =>
          sum + item.interest,
        0
      );

    const totalPaid =
      months.reduce(
        (sum, item) =>
          sum + item.paid,
        0
      );

    const totalRemaining =
      Math.max(
        totalDue -
          totalPaid,
        0
      );

    /* ================= CURRENT CYCLE ================= */

    let currentCycle = null;

    for (
      const monthData of months
    ) {
      const start =
        makeLocalDate(
          monthData.startDate
        );

      const end =
        makeLocalDate(
          monthData.endDate
        );

      /*
        End date ko full day treat karne ke liye
        23:59:59 set kar rahe hain.
      */
      end.setHours(
        23,
        59,
        59,
        999
      );

      if (
        today >= start &&
        today <= end
      ) {
        currentCycle =
          monthData;

        break;
      }
    }

    /* ================= PAID TILL ================= */

    let paidTill = null;

    for (
      const monthData of months
    ) {
      if (
        monthData.remaining <
        0.01
      ) {
        paidTill =
          monthData.label;
      } else {
        break;
      }
    }

    return {
      months,

      payments:
        paymentAllocations,

      totalDue,

      thisMonth:
        currentCycle?.interest ||
        0,

      thisMonthPaid:
        currentCycle?.paid ||
        0,

      thisMonthRemaining:
        currentCycle?.remaining ||
        0,

      paid:
        totalPaid,

      remaining:
        totalRemaining,

      paidTill,
    };
  }

  /* =========================================================
     LOAD PEOPLE
  ========================================================= */

  async function loadPeople() {
    if (!user) return [];

    try {
      const peopleRef =
        collection(
          db,
          "users",
          user.uid,
          "people"
        );

      const peopleSnapshot =
        await getDocs(
          peopleRef
        );

      const peopleData = [];

      let dashboardGiven = 0;
      let dashboardReceived = 0;
      let dashboardOutstanding = 0;
      let dashboardInterestPaid = 0;

      for (
        const personDoc of peopleSnapshot.docs
      ) {
        const personData =
          personDoc.data();

        const loansRef =
          collection(
            db,
            "users",
            user.uid,
            "people",
            personDoc.id,
            "loans"
          );

        const loansSnapshot =
          await getDocs(
            loansRef
          );

        const loans = [];

        let personGiven = 0;
        let personPrincipalPaid = 0;
        let personInterestPaid = 0;
        let personOutstanding = 0;
        let personInterestDue = 0;

        for (
          const loanDoc of loansSnapshot.docs
        ) {
          const loanData =
            loanDoc.data();

          const transactionsRef =
            collection(
              db,
              "users",
              user.uid,
              "people",
              personDoc.id,
              "loans",
              loanDoc.id,
              "transactions"
            );

          const transactionSnapshot =
            await getDocs(
              transactionsRef
            );

          const loanTransactions =
            transactionSnapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          let principalPaid = 0;
          let interestPaid = 0;

          loanTransactions.forEach(
            (transaction) => {
              if (
                transaction.type ===
                "PRINCIPAL_PAYMENT"
              ) {
                principalPaid +=
                  Number(
                    transaction.amount ||
                      0
                  );
              }

              if (
                transaction.type ===
                "INTEREST_PAYMENT"
              ) {
                interestPaid +=
                  Number(
                    transaction.amount ||
                      0
                  );
              }
            }
          );

          const originalPrincipal =
            Number(
              loanData.amountGiven ||
                0
            );

          const presentPrincipal =
            Math.max(
              originalPrincipal -
                principalPaid,
              0
            );

          const interestData =
            calculateInterest(
              loanData,
              loanTransactions
            );

          const loan = {
            id:
              loanDoc.id,

            ...loanData,

            originalPrincipal,

            principalPaid,

            presentPrincipal,

            interestPaid,

            interestDue:
              interestData.totalDue,

            interestRemaining:
              interestData.remaining,

            thisMonthInterest:
              interestData.thisMonth,

            thisMonthInterestPaid:
              interestData.thisMonthPaid,

            thisMonthInterestRemaining:
              interestData.thisMonthRemaining,

            interestPaidTill:
              interestData.paidTill,

            outstanding:
              presentPrincipal,
          };

          loans.push(loan);

          personGiven +=
            originalPrincipal;

          personPrincipalPaid +=
            principalPaid;

          personInterestPaid +=
            interestPaid;

          personOutstanding +=
            presentPrincipal;

          personInterestDue +=
            interestData.remaining;

          dashboardGiven +=
            originalPrincipal;

          dashboardReceived +=
            principalPaid +
            interestPaid;

          dashboardOutstanding +=
            presentPrincipal;

          dashboardInterestPaid +=
            interestPaid;
        }

        peopleData.push({
          id:
            personDoc.id,

          ...personData,

          loans,

          totalGiven:
            personGiven,

          principalPaid:
            personPrincipalPaid,

          interestPaid:
            personInterestPaid,

          outstanding:
            personOutstanding,

          interestDue:
            personInterestDue,
        });
      }

      setPeople(
        peopleData
      );

      setTotalGiven(
        dashboardGiven
      );

      setTotalReceived(
        dashboardReceived
      );

      setTotalOutstanding(
        dashboardOutstanding
      );

      setTotalInterestPaid(
        dashboardInterestPaid
      );

      return peopleData;
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load your data."
      );

      return [];
    }
  }

  /* =========================================================
     AUTH STATE
  ========================================================= */

  useEffect(() => {
    // Keep Firebase login only for the current browser session.
    // Firebase SESSION persistence is cleared when the tab/window closes.
    // The session marker below also protects against a stale Auth session
    // surviving an app/PWA restart.
    const prepareSession = async () => {
      try {
        await setPersistence(
          auth,
          browserSessionPersistence
        );

        if (!sessionStorage.getItem(SESSION_MARKER) && auth.currentUser) {
          await signOut(auth);
        }
      } catch (err) {
        console.error("Could not set session persistence:", err);
      }
    };

    prepareSession();

    // Do not process Firebase verification links inside LendTrack.
    // Firebase's default /__/auth/action page handles verification on the
    // device where the email link is opened. The original device stays signed
    // in and the polling effect below detects emailVerified automatically.
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);

            if (currentUser.emailVerified) {
              setVerificationPending(false);
            } else {
              // Keep the newly registered user signed in while they verify.
              // Do not send them back to the login page.
              setVerificationPending(true);
            }
          } else {
            setUser(null);
            setVerificationPending(false);
            setPeople([]);
            setSelectedPerson(null);
            setSelectedLoan(null);
            setTransactions([]);
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // 15-second cooldown between verification email sends.
  useEffect(() => {
    if (verificationCooldown <= 0) return;

    const timer = setInterval(() => {
      setVerificationCooldown((seconds) =>
        seconds > 0 ? seconds - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [verificationCooldown]);

  // While the verification screen is open, keep checking Firebase for the
  // verification status. The verification link can be opened on another
  // device (for example, phone) while this original app window stays open.
  // As soon as Firebase reports emailVerified=true, this window automatically
  // leaves the verification screen and continues to the normal dashboard.
  useEffect(() => {
    if (!user || !verificationPending || user.emailVerified) return;

    let cancelled = false;

    const checkVerification = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        await currentUser.reload();

        if (!cancelled && auth.currentUser?.emailVerified) {
          setUser(auth.currentUser);
          setVerificationPending(false);
          setError("Email verified successfully. Opening your dashboard...");
        }
      } catch (err) {
        console.error("Verification status check failed:", err);
      }
    };

    // Check immediately, then every 2 seconds until verification is complete.
    checkVerification();
    const timer = setInterval(checkVerification, 2000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user, verificationPending]);

  useEffect(() => {
    if (user) {
      loadPeople();
      loadDeletedItems();
      loadUserProfile(user);
    }
  }, [user]);

  /* =========================================================
     LOAD TRANSACTIONS
  ========================================================= */

  async function loadTransactions(
    personId,
    loanId
  ) {
    if (!user) return [];

    try {
      setLoadingTransactions(
        true
      );

      const transactionsRef =
        collection(
          db,
          "users",
          user.uid,
          "people",
          personId,
          "loans",
          loanId,
          "transactions"
        );

      const snapshot =
        await getDocs(
          transactionsRef
        );

      const transactionData =
        snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

      transactionData.sort(
        (a, b) =>
          (b.date || "").localeCompare(
            a.date || ""
          )
      );

      setTransactions(
        transactionData
      );

      return transactionData;
    } catch (err) {
      console.error(err);

      return [];
    } finally {
      setLoadingTransactions(
        false
      );
    }
  }

  /* =========================================================
     LOGIN / REGISTER
  ========================================================= */

  async function handleAuth(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Use session-only Firebase auth so closing the window/tab logs the user out.
      await setPersistence(
        auth,
        browserSessionPersistence
      );

      if (isRegister) {
        if (verificationCooldown > 0) {
          setError(
            `Please wait ${verificationCooldown} seconds before sending the verification email again.`
          );
          return;
        }

        if (
          password !==
          confirmPassword
        ) {
          setError(
            "Passwords do not match."
          );

          return;
        }

        setSendingVerification(true);

        const credential =
          await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

        sessionStorage.setItem(SESSION_MARKER, "1");

        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            name: name.trim(),
            email: email.trim(),
            phone: "",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        // First-time registration requires email verification.
        // The app stays signed in for this browser session so that, after
        // verification, the user can go straight to the dashboard.

        await sendEmailVerification(credential.user);

        setSendingVerification(false);
        setVerificationPending(true);
        setVerificationCooldown(15);

        setError(
          "Verification email sent. Open the email and click Verify Email. After verification, LendTrack will open your dashboard automatically on this device."
        );
        return;
      }

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      await credential.user.reload();

      if (!credential.user.emailVerified) {
        await signOut(auth);
        sessionStorage.removeItem(SESSION_MARKER);
        setError(
          "Your email is not verified yet. Please verify your email from your inbox before logging in."
        );
        return;
      }

      sessionStorage.setItem(SESSION_MARKER, "1");
    } catch (error) {
      setSendingVerification(false);

      switch (error.code) {
        case "auth/email-already-in-use": {
          // If registration was attempted again with an unverified account,
          // temporarily sign in with the supplied password and resend the
          // verification email. Verified accounts stay on the normal login flow.
          try {
            const existingCredential =
              await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
              );

            await existingCredential.user.reload();

            if (!existingCredential.user.emailVerified) {
              sessionStorage.setItem(SESSION_MARKER, "1");
              setSendingVerification(true);

              await sendEmailVerification(existingCredential.user);
              setSendingVerification(false);
              setVerificationPending(true);
              setVerificationCooldown(15);
              setError(
                "A new verification email has been sent. Open it and click Verify Email. After verification, LendTrack will open your dashboard automatically on this device."
              );
            } else {
              await signOut(auth);
              sessionStorage.removeItem(SESSION_MARKER);
              setError(
                "This email is already registered and verified. Please use Login instead."
              );
            }
          } catch (resendError) {
            setSendingVerification(false);

            if (resendError.code === "auth/invalid-credential") {
              setError(
                "This email is already registered, but the password is incorrect. Please use Login or Forgot Password."
              );
            } else if (resendError.code === "auth/too-many-requests") {
              setError(
                "Too many attempts. Please wait a little before trying again."
              );
            } else {
              setError(
                "This email is already registered. Please use Login."
              );
            }
          }
          break;
        }

        case "auth/invalid-email":
          setError(
            "Please enter a valid email."
          );
          break;

        case "auth/invalid-credential":
          setError(
            "Wrong email or password."
          );
          break;

        case "auth/user-not-found":
          setError(
            "No account found with this email."
          );
          break;

        case "auth/wrong-password":
          setError(
            "Wrong email or password."
          );
          break;

        case "auth/weak-password":
          setError(
            "Password must be at least 6 characters."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            `Firebase Error: ${error.code} - ${error.message}`
          );
      }
    } finally {
      setSendingVerification(false);
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const emailToReset = resetEmail.trim();

    if (!emailToReset) {
      setResetMessage("Please enter your registered email.");
      return;
    }

    try {
      setResetLoading(true);
      setResetMessage("");

      await sendPasswordResetEmail(auth, emailToReset);

      setResetMessage(
        "Password reset link sent. Please check your email inbox."
      );
    } catch (error) {
      switch (error.code) {
        case "auth/invalid-email":
          setResetMessage("Please enter a valid email.");
          break;

        case "auth/user-not-found":
          setResetMessage(
            "No account found with this email."
          );
          break;

        case "auth/network-request-failed":
          setResetMessage(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setResetMessage(
            "Could not send reset link. Please try again."
          );
      }
    } finally {
      setResetLoading(false);
    }
  }

  async function loadUserProfile(currentUser = user) {
    if (!currentUser) return;

    try {
      const profileRef = doc(db, "users", currentUser.uid);
      const profileSnapshot = await getDoc(profileRef);
      const data = profileSnapshot.exists() ? profileSnapshot.data() : {};

      setProfileName(data.name || currentUser.displayName || "");
      setProfileEmail(currentUser.email || data.email || "");
      setProfilePhone(data.phone || "");
    } catch (err) {
      console.error(err);
      setProfileName(currentUser.displayName || "");
      setProfileEmail(currentUser.email || "");
      setProfilePhone("");
    }
  }

  async function openProfile() {
    setProfileMessage("");
    setPasswordMessage("");
    await loadUserProfile();
    setShowProfile(true);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user) return;

    try {
      setSavingProfile(true);
      setProfileMessage("");

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: profileName.trim(),
          email: user.email || profileEmail,
          phone: profilePhone.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setProfileMessage("Could not update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleThemeChange(value) {
    setTheme(value);
    localStorage.setItem("lendtrack-theme", value);
  }

  function handleLanguageChange(value) {
    setLanguage(value);
    localStorage.setItem("lendtrack-language", value);
  }

  async function handleChangePassword(e) {
    e.preventDefault();

    if (!user?.email) return;

    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMessage("");

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error(err);

      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordMessage("Current password is incorrect.");
      } else if (err.code === "auth/too-many-requests") {
        setPasswordMessage("Too many attempts. Please try again later.");
      } else {
        setPasswordMessage("Could not change password. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);

    setSelectedPerson(null);
    setSelectedLoan(null);
    setTransactions([]);
    setShowRecentlyDeleted(false);
  }

  /* =========================================================
     ADD PERSON
  ========================================================= */

  async function handleAddPerson(e) {
    e.preventDefault();

    if (
      !personName ||
      !amount ||
      !dateGiven
    ) {
      alert(
        "Please fill required fields."
      );

      return;
    }

    try {
      setSaving(true);

      const personRef =
        await addDoc(
          collection(
            db,
            "users",
            user.uid,
            "people"
          ),
          {
            name:
              personName,

            phone,

            address: address.trim(),

            createdAt:
              serverTimestamp(),
          }
        );

      const loanRef =
        await addDoc(
          collection(
            db,
            "users",
            user.uid,
            "people",
            personRef.id,
            "loans"
          ),
          {
            amountGiven:
              Number(amount),

            dateGiven,

            interestRate:
              Number(
                interestRate || 0
              ),

            note,

            createdAt:
              serverTimestamp(),
          }
        );

      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "people",
          personRef.id,
          "loans",
          loanRef.id,
          "transactions"
        ),
        {
          type:
            "PRINCIPAL_GIVEN",

          amount:
            Number(amount),

          date:
            dateGiven,

          note:
            "Loan given",

          createdAt:
            serverTimestamp(),
        }
      );

      setPersonName("");
      setPhone("");
      setAddress("");
      setAmount("");
      setDateGiven("");
      setInterestRate("");
      setNote("");

      setShowAddPerson(
        false
      );

      await loadPeople();
    } catch (err) {
      console.error(err);

      alert(
        "Could not add person."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     ADD LOAN
  ========================================================= */

  async function handleAddLoan(e) {
    e.preventDefault();

    if (
      !selectedPerson ||
      !loanAmount ||
      !loanDate
    ) {
      alert(
        "Please fill required fields."
      );

      return;
    }

    try {
      setSavingLoan(true);

      const loanRef =
        await addDoc(
          collection(
            db,
            "users",
            user.uid,
            "people",
            selectedPerson.id,
            "loans"
          ),
          {
            amountGiven:
              Number(
                loanAmount
              ),

            dateGiven:
              loanDate,

            interestRate:
              Number(
                loanInterest || 0
              ),

            note:
              loanNote,

            createdAt:
              serverTimestamp(),
          }
        );

      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "people",
          selectedPerson.id,
          "loans",
          loanRef.id,
          "transactions"
        ),
        {
          type:
            "PRINCIPAL_GIVEN",

          amount:
            Number(
              loanAmount
            ),

          date:
            loanDate,

          note:
            "Loan given",

          createdAt:
            serverTimestamp(),
        }
      );

      setLoanAmount("");
      setLoanDate("");
      setLoanInterest("");
      setLoanNote("");

      setShowAddLoan(false);

      const updatedPeople =
        await loadPeople();

      const updatedPerson =
        updatedPeople.find(
          (person) =>
            person.id ===
            selectedPerson.id
        );

      if (updatedPerson) {
        setSelectedPerson(
          updatedPerson
        );
      }
    } catch (err) {
      console.error(err);

      alert(
        "Could not add loan."
      );
    } finally {
      setSavingLoan(false);
    }
  }

  /* =========================================================
     RECORD PAYMENT
  ========================================================= */

  async function handleRecordPayment(
    e
  ) {
    e.preventDefault();

    if (
      !selectedPerson ||
      !selectedLoan
    ) {
      return;
    }

    if (!paymentDate) {
      alert(
        "Please select payment date."
      );

      return;
    }

    try {
      setSavingPayment(true);

      const currentPresentPrincipal =
        Number(
          selectedLoan.presentPrincipal ||
            0
        );

      const transactionsRef =
        collection(
          db,
          "users",
          user.uid,
          "people",
          selectedPerson.id,
          "loans",
          selectedLoan.id,
          "transactions"
        );

      /* ================= PRINCIPAL ================= */

      if (
        paymentType ===
        "PRINCIPAL"
      ) {
        const value =
          Number(
            paymentAmount
          );

        if (
          !value ||
          value <= 0
        ) {
          alert(
            "Enter a valid payment amount."
          );

          return;
        }

        if (
          value >
          currentPresentPrincipal
        ) {
          alert(
            `Principal payment cannot be more than Present Principal ${money(
              currentPresentPrincipal
            )}`
          );

          return;
        }

        await addDoc(
          transactionsRef,
          {
            type:
              "PRINCIPAL_PAYMENT",

            amount:
              value,

            date:
              paymentDate,

            note:
              paymentNote,

            createdAt:
              serverTimestamp(),
          }
        );
      }

      /* ================= INTEREST ================= */

      if (
        paymentType ===
        "INTEREST"
      ) {
        const value =
          Number(
            paymentAmount
          );

        if (
          !value ||
          value <= 0
        ) {
          alert(
            "Enter a valid payment amount."
          );

          return;
        }

        await addDoc(
          transactionsRef,
          {
            type:
              "INTEREST_PAYMENT",

            amount:
              value,

            date:
              paymentDate,

            note:
              paymentNote,

            createdAt:
              serverTimestamp(),
          }
        );
      }

      /* ================= BOTH ================= */

      if (
        paymentType ===
        "BOTH"
      ) {
        const principal =
          Number(
            principalAmount ||
              0
          );

        const interest =
          Number(
            interestAmount ||
              0
          );

        if (
          principal <= 0 &&
          interest <= 0
        ) {
          alert(
            "Enter payment amount."
          );

          return;
        }

        if (
          principal >
          currentPresentPrincipal
        ) {
          alert(
            `Principal payment cannot be more than Present Principal ${money(
              currentPresentPrincipal
            )}`
          );

          return;
        }

        if (
          principal > 0
        ) {
          await addDoc(
            transactionsRef,
            {
              type:
                "PRINCIPAL_PAYMENT",

              amount:
                principal,

              date:
                paymentDate,

              note:
                paymentNote,

              createdAt:
                serverTimestamp(),
            }
          );
        }

        if (
          interest > 0
        ) {
          await addDoc(
            transactionsRef,
            {
              type:
                "INTEREST_PAYMENT",

              amount:
                interest,

              date:
                paymentDate,

              note:
                paymentNote,

              createdAt:
                serverTimestamp(),
            }
          );
        }
      }

      /* ================= CLEAR ================= */

      setPaymentAmount("");
      setPrincipalAmount("");
      setInterestAmount("");
      setPaymentDate("");
      setPaymentNote("");

      setPaymentType(
        "INTEREST"
      );

      setShowPayment(false);

      /* ================= REFRESH ================= */

      const updatedPeople =
        await loadPeople();

      const updatedTransactions =
        await loadTransactions(
          selectedPerson.id,
          selectedLoan.id
        );

      const updatedPerson =
        updatedPeople.find(
          (person) =>
            person.id ===
            selectedPerson.id
        );

      if (updatedPerson) {
        const updatedLoan =
          updatedPerson.loans.find(
            (loan) =>
              loan.id ===
              selectedLoan.id
          );

        setSelectedPerson(
          updatedPerson
        );

        if (updatedLoan) {
          setSelectedLoan(
            updatedLoan
          );

          setTransactions(
            updatedTransactions
          );
        }
      }
    } catch (err) {
      console.error(err);

      alert(
        "Could not record payment."
      );
    } finally {
      setSavingPayment(false);
    }
  }

  /* =========================================================
     EDIT / DELETE HELPERS
  ========================================================= */

  function getPersonPath(personId) {
    return [
      "users",
      user.uid,
      "people",
      personId,
    ];
  }

  function getLoanPath(personId, loanId) {
    return [
      "users",
      user.uid,
      "people",
      personId,
      "loans",
      loanId,
    ];
  }

  function getTransactionPath(
    personId,
    loanId,
    transactionId
  ) {
    return [
      "users",
      user.uid,
      "people",
      personId,
      "loans",
      loanId,
      "transactions",
      transactionId,
    ];
  }

  /* =========================================================
     RECENTLY DELETED / RECYCLE BIN
  ========================================================= */

  function getDeletedPath(deletedId) {
    return [
      "users",
      user.uid,
      "deletedItems",
      deletedId,
    ];
  }

  async function loadDeletedItems() {
    if (!user) return [];

    try {
      setLoadingDeleted(true);

      const deletedRef = collection(
        db,
        "users",
        user.uid,
        "deletedItems"
      );

      const snapshot = await getDocs(deletedRef);

      const items = snapshot.docs
        .map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        }))
        .sort((a, b) =>
          String(b.deletedAt || "").localeCompare(
            String(a.deletedAt || "")
          )
        );

      setDeletedItems(items);
      return items;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoadingDeleted(false);
    }
  }

  async function archiveItem(data) {
    await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "deletedItems"
      ),
      {
        ...data,
        deletedAt: new Date().toISOString(),
      }
    );
  }

  function formatDeletedDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString(language === "Hindi" ? "hi-IN" : "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function deletedTitle(item) {
    if (item.kind === "person") {
      return item.personData?.name || "Customer";
    }

    if (item.kind === "loan") {
      return `Loan ₹${Number(
        item.loanData?.amountGiven || 0
      ).toLocaleString("en-IN")}`;
    }

    return item.transactionData?.type ===
      "PRINCIPAL_PAYMENT"
      ? "Principal Payment"
      : "Interest Payment";
  }

  function deletedSubtitle(item) {
    if (item.kind === "person") {
      const count = item.loans?.length || 0;
      return `${count} loan${count === 1 ? "" : "s"} • Customer`;
    }

    if (item.kind === "loan") {
      return `${item.personName || "Customer"} • ${item.transactions?.length || 0} transaction${(item.transactions?.length || 0) === 1 ? "" : "s"}`;
    }

    return `${item.personName || "Customer"} • ${item.transactionData?.note || "Payment"}`;
  }

  async function permanentlyDelete(item) {
    const confirmed = window.confirm(
      `Permanently delete ${deletedTitle(item)}?\n\nThis data cannot be restored after this.\n\nAre you sure?`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, ...getDeletedPath(item.id))
      );

      await loadDeletedItems();
    } catch (err) {
      console.error(err);
      alert("Could not permanently delete this item.");
    }
  }

  async function restoreDeletedItem(item) {
    const confirmed = window.confirm(
      `Restore ${deletedTitle(item)}?\n\nThe deleted data and its history will be restored.`
    );

    if (!confirmed) return;

    try {
      if (item.kind === "person") {
        await setDoc(
          doc(
            db,
            "users",
            user.uid,
            "people",
            item.personId
          ),
          item.personData || {}
        );

        for (const loan of item.loans || []) {
          await setDoc(
            doc(
              db,
              "users",
              user.uid,
              "people",
              item.personId,
              "loans",
              loan.id
            ),
            loan.data || {}
          );

          for (const transaction of loan.transactions || []) {
            await setDoc(
              doc(
                db,
                "users",
                user.uid,
                "people",
                item.personId,
                "loans",
                loan.id,
                "transactions",
                transaction.id
              ),
              transaction.data || {}
            );
          }
        }
      }

      if (item.kind === "loan") {
        await setDoc(
          doc(
            db,
            "users",
            user.uid,
            "people",
            item.personId,
            "loans",
            item.loanId
          ),
          item.loanData || {}
        );

        for (const transaction of item.transactions || []) {
          await setDoc(
            doc(
              db,
              "users",
              user.uid,
              "people",
              item.personId,
              "loans",
              item.loanId,
              "transactions",
              transaction.id
            ),
            transaction.data || {}
          );
        }
      }

      if (item.kind === "payment") {
        await setDoc(
          doc(
            db,
            "users",
            user.uid,
            "people",
            item.personId,
            "loans",
            item.loanId,
            "transactions",
            item.transactionId
          ),
          item.transactionData || {}
        );
      }

      await deleteDoc(
        doc(db, ...getDeletedPath(item.id))
      );

      await loadPeople();
      await loadDeletedItems();

      if (selectedPerson) {
        const updatedPeople = await loadPeople();
        const restoredPerson = updatedPeople.find(
          (person) => person.id === selectedPerson.id
        );

        if (restoredPerson) {
          setSelectedPerson(restoredPerson);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Could not restore this item.");
    }
  }

  /* ================= PERSON EDIT ================= */

  function openEditPerson(person) {
    setEditingPerson(person);
    setEditPersonName(person.name || "");
    setEditPhone(person.phone || "");
    setEditAddress(person.address || "");
    setShowEditPerson(true);
  }

  async function handleEditPerson(e) {
    e.preventDefault();

    if (!editingPerson || !editPersonName.trim()) {
      alert("Please enter customer name.");
      return;
    }

    try {
      setSavingPersonEdit(true);

      await updateDoc(
        doc(db, ...getPersonPath(editingPerson.id)),
        {
          name: editPersonName.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim(),
        }
      );

      const updatedPeople = await loadPeople();

      const updatedPerson = updatedPeople.find(
        (person) => person.id === editingPerson.id
      );

      if (updatedPerson) {
        setSelectedPerson(updatedPerson);
      }

      setShowEditPerson(false);
      setEditingPerson(null);
    } catch (err) {
      console.error(err);
      alert("Could not update customer.");
    } finally {
      setSavingPersonEdit(false);
    }
  }

  /* ================= PERSON DELETE ================= */

  async function deleteAllLoanTransactions(
    personId,
    loanId
  ) {
    const transactionsRef = collection(
      db,
      "users",
      user.uid,
      "people",
      personId,
      "loans",
      loanId,
      "transactions"
    );

    const snapshot = await getDocs(transactionsRef);

    for (const transactionDoc of snapshot.docs) {
      await deleteDoc(transactionDoc.ref);
    }
  }

  async function deletePerson(person) {
    const confirmed = window.confirm(
      `Move "${person.name}" to Recently Deleted?\n\nAll of its loans and payment history will be kept safely there.\n\nYou can restore it later.`
    );

    if (!confirmed) return;

    try {
      const archivedLoans = [];

      for (const loan of person.loans || []) {
        const transactionsRef = collection(
          db,
          "users",
          user.uid,
          "people",
          person.id,
          "loans",
          loan.id,
          "transactions"
        );

        const snapshot = await getDocs(transactionsRef);

        archivedLoans.push({
          id: loan.id,
          data: {
            amountGiven: loan.amountGiven,
            dateGiven: loan.dateGiven,
            interestRate: loan.interestRate,
            note: loan.note || "",
          },
          transactions: snapshot.docs.map((transactionDoc) => ({
            id: transactionDoc.id,
            data: transactionDoc.data(),
          })),
        });
      }

      await archiveItem({
        kind: "person",
        personId: person.id,
        personData: {
          name: person.name || "",
          phone: person.phone || "",
        },
        loans: archivedLoans,
      });

      for (const loan of person.loans || []) {
        await deleteAllLoanTransactions(person.id, loan.id);

        await deleteDoc(
          doc(
            db,
            "users",
            user.uid,
            "people",
            person.id,
            "loans",
            loan.id
          )
        );
      }

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "people",
          person.id
        )
      );

      setSelectedPerson(null);
      setSelectedLoan(null);
      setTransactions([]);

      await loadPeople();
      await loadDeletedItems();
    } catch (err) {
      console.error(err);
      alert("Could not move customer to Recently Deleted.");
    }
  }

  /* ================= LOAN EDIT ================= */

  function openEditLoan(loan) {
    setEditingLoan(loan);
    setEditLoanAmount(
      String(loan.amountGiven || "")
    );
    setEditLoanDate(loan.dateGiven || "");
    setEditLoanInterest(
      String(loan.interestRate ?? "")
    );
    setEditLoanNote(loan.note || "");
    setShowEditLoan(true);
  }

  async function handleEditLoan(e) {
    e.preventDefault();

    if (!editingLoan || !selectedPerson) {
      return;
    }

    const newAmount = Number(editLoanAmount);
    const principalPaid = Number(
      editingLoan.principalPaid || 0
    );

    if (!newAmount || newAmount <= 0) {
      alert("Enter a valid loan amount.");
      return;
    }

    if (!editLoanDate) {
      alert("Please select loan date.");
      return;
    }

    if (newAmount < principalPaid) {
      alert(
        `Loan amount cannot be less than Principal Paid ${money(
          principalPaid
        )}.`
      );
      return;
    }

    try {
      setSavingLoanEdit(true);

      await updateDoc(
        doc(
          db,
          ...getLoanPath(
            selectedPerson.id,
            editingLoan.id
          )
        ),
        {
          amountGiven: newAmount,
          dateGiven: editLoanDate,
          interestRate: Number(
            editLoanInterest || 0
          ),
          note: editLoanNote.trim(),
        }
      );

      /* Keep the original "Loan Given" transaction
         consistent with the edited loan. */
      const loanTransactionsRef = collection(
        db,
        "users",
        user.uid,
        "people",
        selectedPerson.id,
        "loans",
        editingLoan.id,
        "transactions"
      );

      const loanTransactionsSnapshot =
        await getDocs(loanTransactionsRef);

      const originalGivenTransaction =
        loanTransactionsSnapshot.docs.find(
          (transactionDoc) =>
            transactionDoc.data().type ===
            "PRINCIPAL_GIVEN"
        );

      if (originalGivenTransaction) {
        await updateDoc(
          originalGivenTransaction.ref,
          {
            amount: newAmount,
            date: editLoanDate,
            note: "Loan given",
          }
        );
      }

      const updatedPeople = await loadPeople();

      const updatedPerson = updatedPeople.find(
        (person) => person.id === selectedPerson.id
      );

      if (updatedPerson) {
        setSelectedPerson(updatedPerson);

        const updatedLoan = updatedPerson.loans.find(
          (loan) => loan.id === editingLoan.id
        );

        if (updatedLoan) {
          setSelectedLoan(updatedLoan);

          const updatedTransactions =
            await loadTransactions(
              selectedPerson.id,
              editingLoan.id
            );

          setTransactions(updatedTransactions);
        }
      }

      setShowEditLoan(false);
      setEditingLoan(null);
    } catch (err) {
      console.error(err);
      alert("Could not update loan.");
    } finally {
      setSavingLoanEdit(false);
    }
  }

  /* ================= LOAN DELETE ================= */

  async function deleteLoan(loan) {
    if (!selectedPerson) return;

    const loanNumber =
      selectedPerson.loans.findIndex(
        (item) => item.id === loan.id
      ) + 1;

    const confirmed = window.confirm(
      `Move Loan ${loanNumber} to Recently Deleted?\n\nAll payment history for this loan will be kept safely there.\n\nYou can restore it later.`
    );

    if (!confirmed) return;

    try {
      const transactionsRef = collection(
        db,
        "users",
        user.uid,
        "people",
        selectedPerson.id,
        "loans",
        loan.id,
        "transactions"
      );

      const snapshot = await getDocs(transactionsRef);

      await archiveItem({
        kind: "loan",
        personId: selectedPerson.id,
        personName: selectedPerson.name || "Customer",
        loanId: loan.id,
        loanData: {
          amountGiven: loan.amountGiven,
          dateGiven: loan.dateGiven,
          interestRate: loan.interestRate,
          note: loan.note || "",
        },
        transactions: snapshot.docs.map((transactionDoc) => ({
          id: transactionDoc.id,
          data: transactionDoc.data(),
        })),
      });

      await deleteAllLoanTransactions(
        selectedPerson.id,
        loan.id
      );

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "people",
          selectedPerson.id,
          "loans",
          loan.id
        )
      );

      const updatedPeople = await loadPeople();
      const updatedPerson = updatedPeople.find(
        (person) => person.id === selectedPerson.id
      );

      setSelectedLoan(null);
      setTransactions([]);

      if (updatedPerson) {
        setSelectedPerson(updatedPerson);
      } else {
        setSelectedPerson(null);
      }

      await loadDeletedItems();
    } catch (err) {
      console.error(err);
      alert("Could not move loan to Recently Deleted.");
    }
  }

  /* ================= PAYMENT EDIT ================= */

  function openEditPayment(payment) {
    setEditingPayment(payment);
    setEditPaymentAmount(
      String(payment.amount || "")
    );
    setEditPaymentDate(payment.date || "");
    setEditPaymentNote(payment.note || "");
    setShowEditPayment(true);
  }

  async function handleEditPayment(e) {
    e.preventDefault();

    if (
      !selectedPerson ||
      !selectedLoan ||
      !editingPayment
    ) {
      return;
    }

    const newAmount = Number(editPaymentAmount);

    if (!newAmount || newAmount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    if (!editPaymentDate) {
      alert("Please select payment date.");
      return;
    }

    if (
      editingPayment.type ===
        "PRINCIPAL_PAYMENT" &&
      newAmount >
        Number(
          selectedLoan.originalPrincipal || 0
        ) -
          Number(
            selectedLoan.principalPaid || 0
          ) +
          Number(editingPayment.amount || 0)
    ) {
      alert(
        `Principal payment cannot be more than Present Principal ${money(
          Number(
            selectedLoan.originalPrincipal || 0
          ) -
            Number(
              selectedLoan.principalPaid || 0
            ) +
            Number(editingPayment.amount || 0)
        )}.`
      );
      return;
    }

    try {
      setSavingPaymentEdit(true);

      await updateDoc(
        doc(
          db,
          ...getTransactionPath(
            selectedPerson.id,
            selectedLoan.id,
            editingPayment.id
          )
        ),
        {
          amount: newAmount,
          date: editPaymentDate,
          note: editPaymentNote.trim(),
        }
      );

      const updatedPeople = await loadPeople();

      const updatedPerson = updatedPeople.find(
        (person) => person.id === selectedPerson.id
      );

      if (updatedPerson) {
        const updatedLoan = updatedPerson.loans.find(
          (loan) => loan.id === selectedLoan.id
        );

        setSelectedPerson(updatedPerson);

        if (updatedLoan) {
          setSelectedLoan(updatedLoan);
        }

        const updatedTransactions =
          await loadTransactions(
            selectedPerson.id,
            selectedLoan.id
          );

        setTransactions(updatedTransactions);
      }

      setShowEditPayment(false);
      setEditingPayment(null);
    } catch (err) {
      console.error(err);
      alert("Could not update payment.");
    } finally {
      setSavingPaymentEdit(false);
    }
  }

  /* ================= PAYMENT DELETE ================= */

  async function deletePayment(payment) {
    if (!selectedPerson || !selectedLoan) return;

    const label =
      payment.type === "PRINCIPAL_PAYMENT"
        ? "principal payment"
        : "interest payment";

    const confirmed = window.confirm(
      `Move this ${label} of ${money(
        payment.amount
      )} to Recently Deleted?\n\nThe payment can be restored later.`
    );

    if (!confirmed) return;

    try {
      await archiveItem({
        kind: "payment",
        personId: selectedPerson.id,
        personName: selectedPerson.name || "Customer",
        loanId: selectedLoan.id,
        transactionId: payment.id,
        transactionData: payment,
      });

      await deleteDoc(
        doc(
          db,
          ...getTransactionPath(
            selectedPerson.id,
            selectedLoan.id,
            payment.id
          )
        )
      );

      const updatedPeople = await loadPeople();
      const updatedPerson = updatedPeople.find(
        (person) => person.id === selectedPerson.id
      );

      if (updatedPerson) {
        const updatedLoan = updatedPerson.loans.find(
          (loan) => loan.id === selectedLoan.id
        );

        setSelectedPerson(updatedPerson);

        if (updatedLoan) {
          setSelectedLoan(updatedLoan);
        }

        const updatedTransactions =
          await loadTransactions(
            selectedPerson.id,
            selectedLoan.id
          );

        setTransactions(updatedTransactions);
      }

      await loadDeletedItems();
    } catch (err) {
      console.error(err);
      alert("Could not move payment to Recently Deleted.");
    }
  }

  /* =========================================================
     CUSTOMER STATEMENT / PDF EXPORT
  ========================================================= */

  async function openCustomerStatement(shouldPrint = false) {
    if (!user || !selectedPerson) return;

    try {
      setStatementLoading(true);
      setPrintingStatement(shouldPrint);

      const statementLoans = [];

      for (const loan of selectedPerson.loans || []) {
        const transactionsRef = collection(
          db,
          "users",
          user.uid,
          "people",
          selectedPerson.id,
          "loans",
          loan.id,
          "transactions"
        );

        const snapshot = await getDocs(transactionsRef);

        const loanTransactions = snapshot.docs
          .map((transactionDoc) => ({
            id: transactionDoc.id,
            ...transactionDoc.data(),
          }))
          .sort((a, b) =>
            (a.date || "").localeCompare(b.date || "")
          );

        const principalPaid = loanTransactions
          .filter(
            (transaction) =>
              transaction.type === "PRINCIPAL_PAYMENT"
          )
          .reduce(
            (sum, transaction) =>
              sum + Number(transaction.amount || 0),
            0
          );

        const interestPaid = loanTransactions
          .filter(
            (transaction) =>
              transaction.type === "INTEREST_PAYMENT"
          )
          .reduce(
            (sum, transaction) =>
              sum + Number(transaction.amount || 0),
            0
          );

        const originalPrincipal = Number(
          loan.amountGiven || 0
        );

        const presentPrincipal = Math.max(
          originalPrincipal - principalPaid,
          0
        );

        const interestData = calculateInterest(
          loan,
          loanTransactions
        );

        statementLoans.push({
          ...loan,
          originalPrincipal,
          principalPaid,
          presentPrincipal,
          interestPaid,
          interestDue: interestData.totalDue,
          interestRemaining: interestData.remaining,
          interestPaidTill: interestData.paidTill,
          transactions: loanTransactions,
          interestData,
        });
      }

      const totalGiven = statementLoans.reduce(
        (sum, loan) =>
          sum + Number(loan.originalPrincipal || 0),
        0
      );

      const totalPrincipalPaid = statementLoans.reduce(
        (sum, loan) =>
          sum + Number(loan.principalPaid || 0),
        0
      );

      const totalOutstanding = statementLoans.reduce(
        (sum, loan) =>
          sum + Number(loan.presentPrincipal || 0),
        0
      );

      const totalInterestDue = statementLoans.reduce(
        (sum, loan) =>
          sum + Number(loan.interestDue || 0),
        0
      );

      const totalInterestPaid = statementLoans.reduce(
        (sum, loan) =>
          sum + Number(loan.interestPaid || 0),
        0
      );

      const totalInterestRemaining = statementLoans.reduce(
        (sum, loan) =>
          sum + Number(loan.interestRemaining || 0),
        0
      );

      const data = {
        person: selectedPerson,
        loans: statementLoans,
        generatedOn: todayDate(),
        totalGiven,
        totalPrincipalPaid,
        totalOutstanding,
        totalInterestDue,
        totalInterestPaid,
        totalInterestRemaining,
      };

      setStatementData(data);
      setShowStatement(true);

      if (shouldPrint) {
        window.setTimeout(() => {
          window.print();
        }, 250);
      }
    } catch (err) {
      console.error(err);
      alert("Could not generate customer statement.");
    } finally {
      setStatementLoading(false);
      setPrintingStatement(false);
    }
  }

  function closeCustomerStatement() {
    setShowStatement(false);
    setStatementData(null);
  }

  /* =========================================================
     TRANSACTION LABEL
  ========================================================= */

  function transactionLabel(
    type
  ) {
    if (
      type ===
      "PRINCIPAL_GIVEN"
    ) {
      return "Loan Given";
    }

    if (
      type ===
      "PRINCIPAL_PAYMENT"
    ) {
      return "Principal Paid";
    }

    if (
      type ===
      "INTEREST_PAYMENT"
    ) {
      return "Interest Paid";
    }

    return type;
  }

  /* =========================================================
     SEARCH + SORT
  ========================================================= */

  const filteredPeople =
    people
      .filter((person) => {
        const search =
          searchTerm
            .trim()
            .toLowerCase();

        if (!search) {
          return true;
        }

        const personName =
          person.name
            ?.toLowerCase() ||
          "";

        const personPhone =
          person.phone
            ?.toLowerCase() ||
          "";

        const personAddress =
          person.address
            ?.toLowerCase() ||
          "";

        return (
          personName.includes(
            search
          ) ||
          personPhone.includes(
            search
          ) ||
          personAddress.includes(
            search
          )
        );
      })
      .sort((a, b) => {
        if (sortOption === "highestInterest") {
          return Number(b.interestDue || 0) - Number(a.interestDue || 0);
        }

        if (sortOption === "highestPrincipal") {
          return Number(b.totalGiven || 0) - Number(a.totalGiven || 0);
        }

        if (sortOption === "highestOutstanding") {
          return Number(b.outstanding || 0) - Number(a.outstanding || 0);
        }

        if (sortOption === "newest") {
          const getTime = (person) => {
            const value = person.createdAt;

            if (!value) return 0;
            if (typeof value?.toMillis === "function") return value.toMillis();
            if (value?.seconds) return Number(value.seconds) * 1000;

            const time = new Date(value).getTime();
            return Number.isNaN(time) ? 0 : time;
          };

          return getTime(b) - getTime(a);
        }

        return (a.name || "").localeCompare(
          b.name || "",
          undefined,
          {
            sensitivity:
              "base",
          }
        );
      });

  const sortLabels = {
    alphabetical: "Alphabetical (A → Z)",
    highestInterest: "Highest Interest Due",
    highestPrincipal: "Highest Principal",
    highestOutstanding: "Highest Outstanding",
    newest: "Newest Customer",
  };

  /* =========================================================
     EMAIL VERIFICATION WAITING SCREEN
  ========================================================= */

  if (user && verificationPending && !user.emailVerified) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="logo">📧</div>

          <h1>LendTrack</h1>

          <p className="auth-subtitle">
            Verify your email to continue
          </p>

          <div className="error-box" style={{ marginBottom: "18px" }}>
            {error || `Verification email sent to ${user.email}.`}
          </div>

          <p style={{ textAlign: "center", color: "#64748b", lineHeight: 1.6 }}>
            Open the verification email and click <b>Verify Email</b>.
            <br />
            After verification, LendTrack will automatically open your dashboard.
          </p>

          <button
            type="button"
            className="primary-btn"
            disabled={loading || verificationCooldown > 0}
            onClick={async () => {
              try {
                setLoading(true);
                setError("");
                await setPersistence(auth, browserSessionPersistence);

                if (!auth.currentUser) {
                  setError("Your session expired. Please login again.");
                  return;
                }

                await auth.currentUser.reload();

                if (auth.currentUser.emailVerified) {
                  setVerificationPending(false);
                  setUser(auth.currentUser);
                  return;
                }

                await sendEmailVerification(auth.currentUser);
                setVerificationCooldown(15);
                setError("A new verification email has been sent. You can resend again after 15 seconds.");
              } catch (err) {
                console.error(err);
                setError("Unable to send verification email. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading
              ? "Sending..."
              : verificationCooldown > 0
              ? `Resend in ${verificationCooldown}s`
              : "Resend"}
          </button>

          <button
            type="button"
            onClick={async () => {
              await signOut(auth);
              sessionStorage.removeItem(SESSION_MARKER);
              setVerificationPending(false);
              setIsRegister(false);
              setError("");
            }}
            style={{
              width: "100%",
              marginTop: "12px",
              border: "none",
              background: "transparent",
              color: "#7c3aed",
              fontWeight: 700,
              cursor: "pointer",
              padding: "10px",
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     LOGIN SCREEN
  ========================================================= */

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="logo">
            💰
          </div>

          <h1>
            LendTrack
          </h1>

          <p className="auth-subtitle">
            {isRegister
              ? "Create your account"
              : "Manage your lending easily"}
          </p>

          <form
            onSubmit={
              handleAuth
            }
          >
            {isRegister && (
              <div className="input-group">
                <label>
                  Name
                </label>

                <input
                  type="text"
                  placeholder="Your name"
                  value={
                    name
                  }
                  autoComplete="name"
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                />
              </div>
            )}

            <div className="input-group">
              <label>
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={
                  email
                }
                autoComplete="email"
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="input-group">
              <label>
                Password
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={
                    password
                  }
                  autoComplete={
                    isRegister
                      ? "new-password"
                      : "current-password"
                  }
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  style={{
                    paddingRight: "48px",
                  }}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  title={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "20px",
                    padding: "6px",
                    lineHeight: 1,
                  }}
                >
                  {showPassword ? (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-4.04 5.11" />
                      <path d="M6.61 6.61A11.84 11.84 0 0 0 1 12c1.73 4.89 6 8 11 8a10.94 10.94 0 0 0 2.12-.24" />
                    </svg>
                  ) : (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {!isRegister && (
                <div
                  style={{
                    textAlign: "right",
                    marginTop: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetMessage("");
                      setShowForgotPassword(true);
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#7c3aed",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {isRegister && (
              <div className="input-group">
                <label>
                  Confirm Password
                </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={
                      confirmPassword
                    }
                    autoComplete="new-password"
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    style={{
                      paddingRight: "48px",
                    }}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    title={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "20px",
                      padding: "6px",
                      lineHeight: 1,
                    }}
                  >
                    {showConfirmPassword ? (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                        <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-4.04 5.11" />
                        <path d="M6.61 6.61A11.84 11.84 0 0 0 1 12c1.73 4.89 6 8 11 8a10.94 10.94 0 0 0 2.12-.24" />
                      </svg>
                    ) : (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <button
              className="primary-btn"
              disabled={
                loading
              }
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Login"}
            </button>
          </form>

          <div className="auth-switch">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              onClick={() => {
                setIsRegister(
                  !isRegister
                );

                setError("");
              }}
            >
              {isRegister
                ? "Login"
                : "Register"}
            </button>
          </div>

          {showForgotPassword && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2>Reset Password</h2>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetMessage("");
                    }}
                  >
                    ×
                  </button>
                </div>

                <p
                  style={{
                    color: "#6b7280",
                    marginTop: 0,
                    marginBottom: "18px",
                  }}
                >
                  Enter your registered email and we'll
                  send you a password reset link.
                </p>

                <div className="input-group">
                  <label>Email</label>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    autoComplete="email"
                    onChange={(e) =>
                      setResetEmail(e.target.value)
                    }
                  />
                </div>

                {resetMessage && (
                  <div
                    className="error-box"
                    style={{
                      background:
                        resetMessage.startsWith(
                          "Password reset link sent"
                        )
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        resetMessage.startsWith(
                          "Password reset link sent"
                        )
                          ? "#15803d"
                          : "#b91c1c",
                    }}
                  >
                    {resetMessage}
                  </div>
                )}

                <button
                  type="button"
                  className="primary-btn"
                  disabled={resetLoading}
                  onClick={handleForgotPassword}
                >
                  {resetLoading
                    ? "Sending..."
                    : "Send Reset Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     USER PROFILE PAGE
  ========================================================= */

  if (showProfile) {
    return (
      <div className={`app-page ${theme === "dark" ? "dark-theme" : ""}`}>
        <header className="top-header">
          <div>
            <h1>💰 LendTrack</h1>
            <p>Profile & Settings</p>
          </div>

          <div className="header-actions">
            <button
              className="profile-icon-btn active"
              onClick={() => setShowProfile(false)}
              title="Close profile"
              aria-label="Close profile"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="main-content profile-page">
          <button className="back-btn" onClick={() => setShowProfile(false)}>
            ← Back to Dashboard
          </button>

          <div className="profile-hero">
            <div className="profile-large-avatar">
              {(profileName || profileEmail || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{profileName || "Your Profile"}</h2>
              <p>{profileEmail}</p>
            </div>
          </div>

          <section className="profile-section-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </div>
              <div><h3>Personal Information</h3><p>Manage your basic profile details</p></div>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="profile-form-grid">
                <div className="input-group">
                  <label>Name</label>
                  <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Enter your name" />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input value={profileEmail} readOnly />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="Enter phone number (optional)" />
                </div>
              </div>
              {profileMessage && <div className="profile-message success">{profileMessage}</div>}
              <button className="profile-save-btn" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div><h3>Security</h3><p>Keep your account password secure</p></div>
            </div>
            <button className="profile-action-btn" onClick={() => { setPasswordMessage(""); setShowChangePassword(true); }}>
              Change Password
              <span>›</span>
            </button>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18" /><path d="M3 12h18" />
                </svg>
              </div>
              <div><h3>App Settings</h3><p>Customize how LendTrack looks</p></div>
            </div>
            <div className="profile-settings-list">
              <div className="profile-setting-row">
                <div><strong>Theme</strong><span>Choose your preferred appearance</span></div>
                <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="profile-setting-row">
                <div><strong>Language</strong><span>App language preference</span></div>
                <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>
          </section>

          <section className="profile-section-card about-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" />
                </svg>
              </div>
              <div><h3>About LendTrack</h3><p>A little about this app</p></div>
            </div>
            <div className="about-content">
              <div><strong>About the App</strong><p>LendTrack is a simple lending management app for managing customers, loans, payments, interest and statements in one place.</p></div>
              <div>
                <strong>Created By</strong>
                <p>
                  <b>Rahul Kumar</b>
                  <br />
                  Designed &amp; Developed by Rahul Kumar
                  <br />
                  <a
                    href="https://www.linkedin.com/in/rahul-kumar-464b28375"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Connect with me on LinkedIn
                  </a>
                </p>
              </div>
            </div>
          </section>
        </main>

        {showChangePassword && (
          <div className="modal-overlay">
            <div className="modal profile-password-modal">
              <div className="modal-header">
                <h2>Change Password</h2>
                <button type="button" onClick={() => setShowChangePassword(false)}>×</button>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className="input-group">
                  <label>Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
                </div>
                <div className="input-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} minLength={6} required />
                </div>

                {passwordMessage && (
                  <div className={`profile-message ${passwordMessage.includes("successfully") ? "success" : "error"}`}>
                    {passwordMessage}
                  </div>
                )}

                <button className="primary-btn" disabled={changingPassword}>
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     LOAN DETAIL
  ========================================================= */

  if (
    selectedPerson &&
    selectedLoan
  ) {
    const interestData =
      calculateInterest(
        selectedLoan,
        transactions
      );

    return (
      <div className={`app-page ${theme === "dark" ? "dark-theme" : ""}`}>
        <header className="top-header">
          <div>
            <h1>
              💰 LendTrack
            </h1>

            <p>
              Manage your lending easily
            </p>
          </div>

          <div className="header-actions">
            <button
              className="profile-icon-btn"
              onClick={openProfile}
              title="Profile"
              aria-label="Open profile"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="main-content">
          <button
            className="back-btn"
            onClick={() => {
              setSelectedLoan(
                null
              );

              setTransactions(
                []
              );
            }}
          >
            ← Back to Loans
          </button>

          {/* LOAN HEADER */}

          <div className="loan-detail-title">
            <div>
              <h2>
                Loan{" "}
                {selectedPerson.loans.findIndex(
                  (loan) =>
                    loan.id ===
                    selectedLoan.id
                ) + 1}
              </h2>

              <p>
                {
                  selectedPerson.name
                }
              </p>
            </div>

            <div className="loan-detail-actions">
              <button
                className="edit-btn"
                onClick={() =>
                  openEditLoan(selectedLoan)
                }
              >
                ✏️ Edit Loan
              </button>

              <button
                className="delete-btn"
                onClick={() =>
                  deleteLoan(selectedLoan)
                }
              >
                🗑️ Delete
              </button>

              <button
                className="payment-btn"
                onClick={() => {
                  setPaymentType(
                    "INTEREST"
                  );

                  setPaymentDate(
                    todayDate()
                  );

                  setShowPayment(
                    true
                  );
                }}
              >
                💳 Record Payment
              </button>
            </div>
          </div>

          {/* SUMMARY */}

          <div className="loan-summary-grid">
            <div className="summary-box original">
              <span>
                Original Principal
              </span>

              <strong>
                {money(
                  selectedLoan.originalPrincipal
                )}
              </strong>
            </div>

            <div className="summary-box paid">
              <span>
                Principal Paid
              </span>

              <strong>
                {money(
                  selectedLoan.principalPaid
                )}
              </strong>
            </div>

            <div className="summary-box present">
              <span>
                Present Principal
              </span>

              <strong>
                {money(
                  selectedLoan.presentPrincipal
                )}
              </strong>
            </div>

            <div className="summary-box interest">
              <span>
                Interest Remaining
              </span>

              <strong>
                {money(
                  interestData.remaining
                )}
              </strong>
            </div>
          </div>

          {/* PRINCIPAL STATUS */}

          <div className="principal-calculation">
            <h3>
              Principal Status
            </h3>

            <div className="calculation-row">
              <span>
                Original Principal
              </span>

              <strong>
                {money(
                  selectedLoan.originalPrincipal
                )}
              </strong>
            </div>

            <div className="calculation-row minus">
              <span>
                − Principal Paid
              </span>

              <strong>
                {money(
                  selectedLoan.principalPaid
                )}
              </strong>
            </div>

            <div className="calculation-line"></div>

            <div className="calculation-row final">
              <span>
                Present Principal
              </span>

              <strong>
                {money(
                  selectedLoan.presentPrincipal
                )}
              </strong>
            </div>
          </div>

          {/* INTEREST SUMMARY */}

          <div className="interest-summary-card">
            <div className="interest-summary-header">
              <div>
                <h3>
                  Interest Summary
                </h3>

                <p>
                  {selectedLoan.interestRate ||
                    0}
                  % per month
                </p>
              </div>
            </div>

            <div className="interest-summary-grid">
              <div>
                <span>
                  This Month Interest
                </span>

                <strong>
                  {money(
                    interestData.thisMonth
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Total Interest Due
                </span>

                <strong>
                  {money(
                    interestData.totalDue
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Interest Paid
                </span>

                <strong>
                  {money(
                    interestData.paid
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Interest Remaining
                </span>

                <strong className="remaining-interest">
                  {money(
                    interestData.remaining
                  )}
                </strong>
              </div>
            </div>

            <div className="interest-paid-till">
              <div>
                <span>
                  Interest Paid Till
                </span>

                <strong>
                  {interestData.paidTill ||
                    "No month fully paid yet"}
                </strong>
              </div>

              <div>
                <span>
                  This Month Remaining
                </span>

                <strong>
                  {money(
                    interestData.thisMonthRemaining
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* MONTH WISE INTEREST */}

          <div className="detail-card">
            <div className="section-heading">
              <div>
                <h3>
                  Month-wise Interest
                </h3>

                <p>
                  Oldest unpaid interest is adjusted first.
                </p>
              </div>
            </div>

            {interestData.months
              .length === 0 ? (
              <div className="empty-small">
                No interest calculated.
              </div>
            ) : (
              <div className="month-interest-list">
                {interestData.months
                  .slice()
                  .reverse()
                  .map(
                    (month) => (
                      <div
                        className="month-interest-row"
                        key={
                          month.key
                        }
                      >
                        <div className="month-name">
                          <strong>
                            {
                              month.label
                            }
                          </strong>

                          <span>
                            Principal:{" "}
                            {money(
                              month.principal
                            )}
                          </span>

                          <small>
                            {formatDate(
                              month.startDate
                            )}{" "}
                            →{" "}
                            {formatDate(
                              month.endDate
                            )}
                          </small>
                        </div>

                        <div className="month-interest-values">
                          <div>
                            <span>
                              Due
                            </span>

                            <strong>
                              {money(
                                month.interest
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Paid
                            </span>

                            <strong className="green-text">
                              {money(
                                month.paid
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Remaining
                            </span>

                            <strong className="red-text">
                              {money(
                                month.remaining
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="month-status">
                          {month.remaining <
                          0.01 ? (
                            <span className="paid-badge">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="due-badge">
                              Due
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}
              </div>
            )}
          </div>

          {/* LOAN INFORMATION */}

          <div className="detail-card">
            <h3>
              Loan Information
            </h3>

            <div className="detail-grid">
              <div>
                <span>
                  Amount Given
                </span>

                <strong>
                  {money(
                    selectedLoan.amountGiven
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Date Given
                </span>

                <strong>
                  {formatDate(
                    selectedLoan.dateGiven
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Interest Rate
                </span>

                <strong>
                  {selectedLoan.interestRate ||
                    0}
                  % / month
                </strong>
              </div>

              <div>
                <span>
                  Present Principal
                </span>

                <strong>
                  {money(
                    selectedLoan.presentPrincipal
                  )}
                </strong>
              </div>
            </div>

            {selectedLoan.note && (
              <div className="note-box">
                <strong>
                  Note:
                </strong>{" "}
                {selectedLoan.note}
              </div>
            )}
          </div>

          {/* TRANSACTION HISTORY */}

          <div className="detail-card">
            <div className="section-heading">
              <div>
                <h3>
                  Transaction History
                </h3>

                <p>
                  Latest transaction first
                </p>
              </div>
            </div>

            {loadingTransactions ? (
              <p>
                Loading transactions...
              </p>
            ) : (
              <div className="transaction-columns">
                {/* PRINCIPAL */}

                <div className="transaction-section">
                  <div className="transaction-section-title principal-title">
                    <h3>
                      Principal
                    </h3>
                  </div>

                  {transactions.filter(
                    (transaction) =>
                      transaction.type ===
                        "PRINCIPAL_GIVEN" ||
                      transaction.type ===
                        "PRINCIPAL_PAYMENT"
                  ).length ===
                  0 ? (
                    <div className="empty-small">
                      No principal transactions.
                    </div>
                  ) : (
                    <div className="transactions">
                      {transactions
                        .filter(
                          (
                            transaction
                          ) =>
                            transaction.type ===
                              "PRINCIPAL_GIVEN" ||
                            transaction.type ===
                              "PRINCIPAL_PAYMENT"
                        )
                        .map(
                          (
                            transaction
                          ) => (
                            <div
                              className="transaction-row"
                              key={
                                transaction.id
                              }
                            >
                              <div>
                                <strong>
                                  {transactionLabel(
                                    transaction.type
                                  )}
                                </strong>

                                <span>
                                  {formatDate(
                                    transaction.date
                                  )}
                                </span>

                                {transaction.note && (
                                  <small>
                                    {
                                      transaction.note
                                    }
                                  </small>
                                )}
                              </div>

                              {transaction.type !==
                                "PRINCIPAL_GIVEN" && (
                                <div className="transaction-actions">
                                  <button
                                    className="transaction-edit-btn"
                                    onClick={() =>
                                      openEditPayment(
                                        transaction
                                      )
                                    }
                                  >
                                    ✏️
                                  </button>

                                  <button
                                    className="transaction-delete-btn"
                                    onClick={() =>
                                      deletePayment(
                                        transaction
                                      )
                                    }
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}

                              <strong
                                className={
                                  transaction.type ===
                                  "PRINCIPAL_GIVEN"
                                    ? "amount-given"
                                    : "amount-received"
                                }
                              >
                                {transaction.type ===
                                "PRINCIPAL_GIVEN"
                                  ? "+"
                                  : "-"}
                                {money(
                                  transaction.amount
                                )}
                              </strong>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </div>

                {/* INTEREST */}

                <div className="transaction-section">
                  <div className="transaction-section-title interest-title">
                    <h3>
                      Interest
                    </h3>
                  </div>

                  {interestData.payments
                    .length === 0 ? (
                    <div className="empty-small">
                      No interest transactions.
                    </div>
                  ) : (
                    <div className="transactions">
                      {interestData.payments
                        .slice()
                        .reverse()
                        .map(
                          (
                            payment
                          ) => (
                            <div
                              className="transaction-row interest-payment-row"
                              key={
                                payment.id
                              }
                            >
                              <div>
                                <strong>
                                  Interest Paid
                                </strong>

                                <span>
                                  {formatDate(
                                    payment.date
                                  )}
                                </span>

                                {payment.allocations
                                  .length >
                                  0 && (
                                  <div className="interest-adjustment">
                                    <span>
                                      Adjusted to:
                                    </span>

                                    {payment.allocations.map(
                                      (
                                        allocation
                                      ) => (
                                        <small
                                          key={
                                            allocation.monthKey
                                          }
                                        >
                                          {
                                            allocation.monthLabel
                                          }{" "}
                                          →{" "}
                                          {money(
                                            allocation.amount
                                          )}
                                        </small>
                                      )
                                    )}
                                  </div>
                                )}

                                {payment.unallocated >
                                  0 && (
                                  <small className="unallocated-text">
                                    Unallocated:{" "}
                                    {money(
                                      payment.unallocated
                                    )}
                                  </small>
                                )}

                                {payment.note && (
                                  <small>
                                    {
                                      payment.note
                                    }
                                  </small>
                                )}
                              </div>

                              <div className="transaction-actions">
                                <button
                                  className="transaction-edit-btn"
                                  onClick={() =>
                                    openEditPayment(
                                      payment
                                    )
                                  }
                                >
                                  ✏️
                                </button>

                                <button
                                  className="transaction-delete-btn"
                                  onClick={() =>
                                    deletePayment(
                                      payment
                                    )
                                  }
                                >
                                  🗑️
                                </button>
                              </div>

                              <strong className="amount-received">
                                -
                                {money(
                                  payment.amount
                                )}
                              </strong>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* PAYMENT MODAL */}

        {showPayment && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>
                  Record Payment
                </h2>

                <button
                  onClick={() =>
                    setShowPayment(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  handleRecordPayment
                }
              >
                <div className="input-group">
                  <label>
                    Payment Type
                  </label>

                  <select
                    value={
                      paymentType
                    }
                    onChange={(e) =>
                      setPaymentType(
                        e.target.value
                      )
                    }
                  >
                    <option value="INTEREST">
                      Interest
                    </option>

                    <option value="PRINCIPAL">
                      Principal
                    </option>

                    <option value="BOTH">
                      Both
                    </option>
                  </select>
                </div>

                {paymentType !==
                  "BOTH" && (
                  <div className="input-group">
                    <label>
                      {paymentType ===
                      "INTEREST"
                        ? "Interest Payment Amount"
                        : "Principal Payment Amount"}
                    </label>

                    <input
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={
                        paymentAmount
                      }
                      onChange={(e) =>
                        setPaymentAmount(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                )}

                {paymentType ===
                  "BOTH" && (
                  <>
                    <div className="input-group">
                      <label>
                        Principal Paid
                      </label>

                      <input
                        type="number"
                        min="0"
                        placeholder="Principal amount"
                        value={
                          principalAmount
                        }
                        onChange={(
                          e
                        ) =>
                          setPrincipalAmount(
                            e.target
                              .value
                          )
                        }
                      />
                    </div>

                    <div className="input-group">
                      <label>
                        Interest Paid
                      </label>

                      <input
                        type="number"
                        min="0"
                        placeholder="Interest amount"
                        value={
                          interestAmount
                        }
                        onChange={(
                          e
                        ) =>
                          setInterestAmount(
                            e.target
                              .value
                          )
                        }
                      />
                    </div>

                    <div className="payment-total">
                      Total Payment:{" "}
                      {money(
                        Number(
                          principalAmount ||
                            0
                        ) +
                          Number(
                            interestAmount ||
                              0
                          )
                      )}
                    </div>
                  </>
                )}

                {paymentType ===
                  "PRINCIPAL" && (
                  <div className="present-principal-preview">
                    Present Principal:{" "}
                    <strong>
                      {money(
                        selectedLoan.presentPrincipal
                      )}
                    </strong>
                  </div>
                )}

                {paymentType ===
                  "INTEREST" && (
                  <div className="present-interest-preview">
                    Interest Due:{" "}
                    <strong>
                      {money(
                        interestData.remaining
                      )}
                    </strong>
                  </div>
                )}

                <div className="input-group">
                  <label>
                    Payment Date
                  </label>

                  <input
                    type="date"
                    value={
                      paymentDate
                    }
                    onChange={(e) =>
                      setPaymentDate(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    Note (optional)
                  </label>

                  <input
                    type="text"
                    placeholder="Payment note"
                    value={
                      paymentNote
                    }
                    onChange={(e) =>
                      setPaymentNote(
                        e.target.value
                      )
                    }
                  />
                </div>

                <button
                  className="primary-btn"
                  disabled={
                    savingPayment
                  }
                >
                  {savingPayment
                    ? "Saving..."
                    : "Save Payment"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* EDIT PAYMENT MODAL */}

        {showEditPayment && editingPayment && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>
                  Edit{" "}
                  {editingPayment.type ===
                  "PRINCIPAL_PAYMENT"
                    ? "Principal Payment"
                    : "Interest Payment"}
                </h2>

                <button
                  onClick={() =>
                    setShowEditPayment(false)
                  }
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEditPayment}>
                <div className="input-group">
                  <label>Payment Amount</label>

                  <input
                    type="number"
                    min="1"
                    value={editPaymentAmount}
                    onChange={(e) =>
                      setEditPaymentAmount(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Payment Date</label>

                  <input
                    type="date"
                    value={editPaymentDate}
                    onChange={(e) =>
                      setEditPaymentDate(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Note (optional)</label>

                  <input
                    type="text"
                    placeholder="Payment note"
                    value={editPaymentNote}
                    onChange={(e) =>
                      setEditPaymentNote(
                        e.target.value
                      )
                    }
                  />
                </div>

                <button
                  className="primary-btn"
                  disabled={savingPaymentEdit}
                >
                  {savingPaymentEdit
                    ? "Saving..."
                    : "Update Payment"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     CUSTOMER STATEMENT PAGE
  ========================================================= */

  if (showStatement && statementData) {
    const statement = statementData;

    return (
      <div className={`app-page statement-page ${theme === "dark" ? "dark-theme" : ""}`}>
        <header className="top-header statement-no-print">
          <div>
            <h1>💰 LendTrack</h1>
            <p>Customer Statement</p>
          </div>

          <div className="statement-header-actions">
            <button
              className="statement-print-btn"
              onClick={() => window.print()}
            >
              📄 PDF Export
            </button>

            <button
              className="logout-btn"
              onClick={closeCustomerStatement}
            >
              ← Back
            </button>
          </div>
        </header>

        <main className="main-content statement-content">
          <div className="statement-paper">
            <div className="statement-title-row">
              <div>
                <h2>Customer Statement</h2>
                <p>
                  Complete lending and payment statement
                </p>
              </div>

              <div className="statement-date">
                Generated: {formatDate(statement.generatedOn)}
              </div>
            </div>

            <div className="statement-customer">
              <div className="statement-avatar">
                {statement.person.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3>{statement.person.name}</h3>
                <p>
                  {statement.person.phone ||
                    "No phone number"}
                </p>
              </div>
            </div>

            <div className="statement-summary-grid">
              <div>
                <span>Total Given</span>
                <strong>{money(statement.totalGiven)}</strong>
              </div>

              <div>
                <span>Principal Paid</span>
                <strong>
                  {money(statement.totalPrincipalPaid)}
                </strong>
              </div>

              <div>
                <span>Outstanding</span>
                <strong>
                  {money(statement.totalOutstanding)}
                </strong>
              </div>

              <div>
                <span>Interest Paid</span>
                <strong>
                  {money(statement.totalInterestPaid)}
                </strong>
              </div>

              <div>
                <span>Interest Due</span>
                <strong className="red-text">
                  {money(statement.totalInterestRemaining)}
                </strong>
              </div>
            </div>

            <div className="statement-section">
              <h3>Loan Summary</h3>

              {statement.loans.length === 0 ? (
                <div className="empty-small">
                  No loans found.
                </div>
              ) : (
                <div className="statement-loan-list">
                  {statement.loans.map((loan, index) => (
                    <div
                      className="statement-loan-card"
                      key={loan.id}
                    >
                      <div className="statement-loan-heading">
                        <div>
                          <strong>
                            Loan {index + 1}
                          </strong>
                          <span>
                            Given: {formatDate(loan.dateGiven)}
                          </span>
                        </div>

                        <strong>
                          {money(loan.presentPrincipal)}
                        </strong>
                      </div>

                      <div className="statement-loan-grid">
                        <div>
                          <span>Original Principal</span>
                          <strong>
                            {money(loan.originalPrincipal)}
                          </strong>
                        </div>

                        <div>
                          <span>Principal Paid</span>
                          <strong>
                            {money(loan.principalPaid)}
                          </strong>
                        </div>

                        <div>
                          <span>Present Principal</span>
                          <strong>
                            {money(loan.presentPrincipal)}
                          </strong>
                        </div>

                        <div>
                          <span>Interest Rate</span>
                          <strong>
                            {loan.interestRate || 0}% / month
                          </strong>
                        </div>

                        <div>
                          <span>Total Interest</span>
                          <strong>
                            {money(loan.interestDue)}
                          </strong>
                        </div>

                        <div>
                          <span>Interest Paid</span>
                          <strong>
                            {money(loan.interestPaid)}
                          </strong>
                        </div>

                        <div>
                          <span>Interest Remaining</span>
                          <strong className="red-text">
                            {money(loan.interestRemaining)}
                          </strong>
                        </div>

                        <div>
                          <span>Interest Paid Till</span>
                          <strong>
                            {loan.interestPaidTill || "No month fully paid"}
                          </strong>
                        </div>
                      </div>

                      {loan.note && (
                        <div className="statement-note">
                          <strong>Note:</strong> {loan.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="statement-section">
              <h3>Transaction History</h3>

              {statement.loans.map((loan, loanIndex) => (
                <div
                  className="statement-transactions-block"
                  key={loan.id}
                >
                  <h4>Loan {loanIndex + 1}</h4>

                  {loan.transactions.length === 0 ? (
                    <div className="empty-small">
                      No transactions.
                    </div>
                  ) : (
                    <div className="statement-table-wrap">
                      <table className="statement-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Transaction</th>
                            <th>Note</th>
                            <th className="amount-column">
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {loan.transactions
                            .slice()
                            .reverse()
                            .map((transaction) => (
                              <tr key={transaction.id}>
                                <td>
                                  {formatDate(transaction.date)}
                                </td>

                                <td>
                                  {transactionLabel(
                                    transaction.type
                                  )}
                                </td>

                                <td>
                                  {transaction.note || "-"}
                                </td>

                                <td
                                  className={`amount-column ${
                                    transaction.type ===
                                    "PRINCIPAL_GIVEN"
                                      ? "amount-given"
                                      : "amount-received"
                                  }`}
                                >
                                  {transaction.type ===
                                  "PRINCIPAL_GIVEN"
                                    ? "+"
                                    : "-"}
                                  {money(transaction.amount)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="statement-footer">
              <strong>LendTrack</strong>
              <span>
                This statement is generated from the records stored in your
                LendTrack account.
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =========================================================
     CUSTOMER DETAIL
  ========================================================= */

  if (selectedPerson) {
    return (
      <div className={`app-page ${theme === "dark" ? "dark-theme" : ""}`}>
        <header className="top-header">
          <div>
            <h1>
              💰 LendTrack
            </h1>

            <p>
              Manage your lending easily
            </p>
          </div>

          <div className="header-actions">
            <button
              className="profile-icon-btn"
              onClick={openProfile}
              title="Profile"
              aria-label="Open profile"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="main-content">
          <button
            className="back-btn"
            onClick={() =>
              setSelectedPerson(
                null
              )
            }
          >
            ← Back to Customers
          </button>

          <div className="customer-profile">
            <div className="avatar">
              {selectedPerson.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div className="customer-profile-info">
              <h2>
                {
                  selectedPerson.name
                }
              </h2>

              <p>
                {selectedPerson.phone ||
                  "No phone number"}
              </p>
          {selectedPerson.address && (
            <p className="customer-address">📍 {selectedPerson.address}</p>
          )}
            </div>

            <div className="customer-actions">
              <button
                className="statement-btn"
                onClick={() => openCustomerStatement(false)}
                disabled={statementLoading}
              >
                🧾 Statement
              </button>

              <button
                className="pdf-export-btn"
                onClick={() => openCustomerStatement(true)}
                disabled={statementLoading}
              >
                {statementLoading && printingStatement
                  ? "Preparing..."
                  : "📄 PDF Export"}
              </button>

              <button
                className="edit-btn"
                onClick={() =>
                  openEditPerson(selectedPerson)
                }
              >
                ✏️ Edit
              </button>

              <button
                className="delete-btn"
                onClick={() =>
                  deletePerson(selectedPerson)
                }
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          <div className="section-heading">
            <div>
              <h2>
                Loans
              </h2>

              <p>
                {
                  selectedPerson
                    .loans.length
                }{" "}
                loan
                {selectedPerson
                  .loans.length !==
                1
                  ? "s"
                  : ""}
              </p>
            </div>

            <button
              className="add-loan-btn"
              onClick={() => {
                setLoanDate(
                  todayDate()
                );

                setShowAddLoan(
                  true
                );
              }}
            >
              + Add Loan
            </button>
          </div>

          {selectedPerson
            .loans.length ===
          0 ? (
            <div className="empty-state">
              <div>
                💰
              </div>

              <h3>
                No loans yet
              </h3>

              <p>
                Add a loan for this customer.
              </p>
            </div>
          ) : (
            <div className="loans-list">
              {selectedPerson.loans.map(
                (
                  loan,
                  index
                ) => (
                  <div
                    className="loan-card"
                    key={
                      loan.id
                    }
                    onClick={() => {
                      setSelectedLoan(
                        loan
                      );

                      setTransactions(
                        []
                      );

                      loadTransactions(
                        selectedPerson.id,
                        loan.id
                      );
                    }}
                  >
                    <div className="loan-number">
                      {index + 1}
                    </div>

                    <div className="loan-card-content">
                      <div className="loan-card-top">
                        <div>
                          <span className="loan-label">
                            Loan{" "}
                            {index + 1}
                          </span>

                          <h3>
                            {money(
                              loan.presentPrincipal
                            )}
                          </h3>

                          <small>
                            Present Principal
                          </small>
                        </div>

                        <div className="loan-card-actions">
                          <button
                            className="small-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditLoan(loan);
                            }}
                          >
                            ✏️
                          </button>

                          <button
                            className="small-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLoan(loan);
                            }}
                          >
                            🗑️
                          </button>

                          <span className="arrow">
                            →
                          </span>
                        </div>
                      </div>

                      <div className="loan-mini-stats">
                        <div>
                          <span>
                            Original
                          </span>

                          <strong>
                            {money(
                              loan.originalPrincipal
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Principal Paid
                          </span>

                          <strong>
                            {money(
                              loan.principalPaid
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Interest Due
                          </span>

                          <strong
                            className={
                              loan.interestRemaining >
                              0
                                ? "red-text"
                                : "green-text"
                            }
                          >
                            {loan.interestRemaining >
                            0
                              ? money(
                                  loan.interestRemaining
                                )
                              : "No Due"}
                          </strong>
                        </div>

                        <div className="loan-date-stat">
                          <span>
                            Date Given
                          </span>

                          <strong>
                            {formatDate(loan.dateGiven)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* ADD LOAN MODAL */}

          {showAddLoan && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2>
                    Add New Loan
                  </h2>

                  <button
                    onClick={() =>
                      setShowAddLoan(
                        false
                      )
                    }
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={
                    handleAddLoan
                  }
                >
                  <div className="input-group">
                    <label>
                      Loan Amount
                    </label>

                    <input
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={
                        loanAmount
                      }
                      onChange={(e) =>
                        setLoanAmount(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>
                      Date Given
                    </label>

                    <input
                      type="date"
                      value={
                        loanDate
                      }
                      onChange={(e) =>
                        setLoanDate(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>
                      Monthly Interest Rate (%)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 3"
                      value={
                        loanInterest
                      }
                      onChange={(e) =>
                        setLoanInterest(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="input-group">
                    <label>
                      Note
                    </label>

                    <input
                      type="text"
                      placeholder="Optional note"
                      value={
                        loanNote
                      }
                      onChange={(e) =>
                        setLoanNote(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <button
                    className="primary-btn"
                    disabled={
                      savingLoan
                    }
                  >
                    {savingLoan
                      ? "Saving..."
                      : "Add Loan"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* EDIT CUSTOMER MODAL */}

          {showEditPerson && editingPerson && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2>Edit Customer</h2>

                  <button
                    onClick={() =>
                      setShowEditPerson(false)
                    }
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleEditPerson}>
                  <div className="input-group">
                    <label>Name</label>

                    <input
                      type="text"
                      placeholder="Customer name"
                      value={editPersonName}
                      onChange={(e) =>
                        setEditPersonName(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Phone</label>

                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={editPhone}
                      onChange={(e) =>
                        setEditPhone(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  

          <div className="input-group">
            <label>Address</label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Enter customer address"
              rows="2"
              className="address-textarea"
            />
          </div>
<button
                    className="primary-btn"
                    disabled={savingPersonEdit}
                  >
                    {savingPersonEdit
                      ? "Saving..."
                      : "Update Customer"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* EDIT LOAN MODAL */}

          {showEditLoan && editingLoan && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2>Edit Loan</h2>

                  <button
                    onClick={() =>
                      setShowEditLoan(false)
                    }
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleEditLoan}>
                  <div className="input-group">
                    <label>Loan Amount</label>

                    <input
                      type="number"
                      min="1"
                      value={editLoanAmount}
                      onChange={(e) =>
                        setEditLoanAmount(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Date Given</label>

                    <input
                      type="date"
                      value={editLoanDate}
                      onChange={(e) =>
                        setEditLoanDate(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>
                      Monthly Interest Rate (%)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 3"
                      value={editLoanInterest}
                      onChange={(e) =>
                        setEditLoanInterest(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="input-group">
                    <label>Note</label>

                    <input
                      type="text"
                      placeholder="Optional note"
                      value={editLoanNote}
                      onChange={(e) =>
                        setEditLoanNote(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="edit-warning">
                    ⚠️ Changing loan amount, date or
                    interest rate can change the
                    calculated interest.
                  </div>

                  <button
                    className="primary-btn"
                    disabled={savingLoanEdit}
                  >
                    {savingLoanEdit
                      ? "Saving..."
                      : "Update Loan"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  /* =========================================================
     RECENTLY DELETED PAGE
  ========================================================= */

  if (showRecentlyDeleted) {
    return (
      <div className={`app-page ${theme === "dark" ? "dark-theme" : ""}`}>
        <header className="top-header">
          <div>
            <h1>💰 LendTrack</h1>
            <p>Manage your lending easily</p>
          </div>

          <div className="header-actions">
            <button className="profile-icon-btn" onClick={openProfile} title="Profile" aria-label="Open profile">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="main-content recently-deleted-page">
          <button
            className="back-btn"
            onClick={() => setShowRecentlyDeleted(false)}
          >
            ← Back to Customers
          </button>

          <div className="deleted-page-hero">
            <div className="deleted-hero-icon">🗑️</div>
            <div className="deleted-hero-text">
              <h2>Recently Deleted</h2>
              <p>
                Deleted customers, loans and payments are kept here safely.
                You can restore them or permanently delete them.
              </p>
            </div>
            <div className="deleted-total-pill">
              {deletedItems.length}{" "}
              {deletedItems.length === 1 ? "item" : "items"}
            </div>
          </div>

          {loadingDeleted ? (
            <div className="deleted-empty-card">
              <div className="deleted-empty-icon">⏳</div>
              <h3>Loading deleted items...</h3>
              <p>Please wait a moment.</p>
            </div>
          ) : deletedItems.length === 0 ? (
            <div className="deleted-empty-card">
              <div className="deleted-empty-icon">✨</div>
              <h3>Recently Deleted is empty</h3>
              <p>
                Deleted customers, loans and payments will appear here.
              </p>
            </div>
          ) : (
            <div className="deleted-page-list">
              {deletedItems.map((item) => {
                const isPerson = item.kind === "person";
                const isLoan = item.kind === "loan";

                return (
                  <div
                    className={`deleted-item-card ${
                      isPerson
                        ? "deleted-person"
                        : isLoan
                        ? "deleted-loan"
                        : "deleted-payment"
                    }`}
                    key={item.id}
                  >
                    <div className="deleted-item-main">
                      <div className="deleted-item-icon">
                        {isPerson ? "👤" : isLoan ? "💰" : "💳"}
                      </div>

                      <div className="deleted-item-info">
                        <div className="deleted-item-top">
                          <span className="deleted-type-badge">
                            {isPerson
                              ? "CUSTOMER"
                              : isLoan
                              ? "LOAN"
                              : "PAYMENT"}
                          </span>

                          <span className="deleted-date">
                            Deleted {formatDeletedDate(item.deletedAt)}
                          </span>
                        </div>

                        <h3>{deletedTitle(item)}</h3>
                        <p>{deletedSubtitle(item)}</p>

                        {!isPerson && item.loanData?.dateGiven && (
                          <small>
                            Loan date: {formatDate(item.loanData.dateGiven)}
                          </small>
                        )}

                        {item.transactionData?.date && (
                          <small>
                            Payment date:{" "}
                            {formatDate(item.transactionData.date)}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="deleted-item-actions">
                      <button
                        className="restore-btn"
                        onClick={() => restoreDeletedItem(item)}
                      >
                        ↩ Restore
                      </button>

                      <button
                        className="permanent-delete-btn"
                        onClick={() => permanentlyDelete(item)}
                      >
                        🗑️ Delete Permanently
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <div className={`app-page ${theme === "dark" ? "dark-theme" : ""}`}>
      <header className="top-header">
        <div>
          <h1>
            💰 LendTrack
          </h1>

          <p>
            Manage your lending easily
          </p>
        </div>

          <div className="header-actions">
            <button className="profile-icon-btn" onClick={openProfile} title="Profile" aria-label="Open profile">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
      </header>

      <main className="main-content">
        <div className="welcome">
          <h2>
            Welcome back 👋
          </h2>

          <p>
            {user.email}
          </p>
        </div>

        {/* STATS */}

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Given</span>
            <strong>
              {showDashboardBalances ? money(totalGiven) : "••••••"}
            </strong>
          </div>

          <div className="stat-card">
            <span>Outstanding</span>
            <strong>
              {showDashboardBalances ? money(totalOutstanding) : "••••••"}
            </strong>
          </div>

          <div className="stat-card">
            <span>Interest Paid</span>
            <strong>
              {showDashboardBalances ? money(totalInterestPaid) : "••••••"}
            </strong>
          </div>

          <div className="stat-card">
            <span>Total Received</span>
            <strong>
              {showDashboardBalances ? money(totalReceived) : "••••••"}
            </strong>
          </div>
        </div>

        <div className="balance-toggle-wrap">
          <button
            type="button"
            className={
              showDashboardBalances
                ? "balance-toggle-btn balance-visible"
                : "balance-toggle-btn"
            }
            onClick={() =>
              setShowDashboardBalances((prev) => !prev)
            }
          >
            {showDashboardBalances
              ? "🙈 Hide Balance"
              : "👁️ View Balance"}
          </button>
        </div>

        {/* CUSTOMER HEADER */}

        <div className="people-header">
          <div>
            <h2>
              Customers
            </h2>

            <p>
              {
                filteredPeople.length
              }{" "}
              customer
              {filteredPeople.length !==
              1
                ? "s"
                : ""}
            </p>
          </div>

          <div className="people-header-actions">
            <div className="sort-control">
              <button
                type="button"
                className="sort-toggle-btn"
                onClick={() =>
                  setShowSortMenu((prev) => !prev)
                }
              >
                ↕ Sort
              </button>

              {showSortMenu && (
                <div className="sort-menu">
                  <div className="sort-menu-title">
                    Sort Customers
                  </div>

                  {Object.entries(sortLabels).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={
                          sortOption === value
                            ? "sort-menu-item active"
                            : "sort-menu-item"
                        }
                        onClick={() => {
                          setSortOption(value);
                          setShowSortMenu(false);
                        }}
                      >
                        <span>{label}</span>
                        {sortOption === value && (
                          <span className="sort-check">✓</span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <button
              className="deleted-toggle-btn"
              onClick={async () => {
                await loadDeletedItems();
                setShowRecentlyDeleted(true);
              }}
            >
              🗑️ Recently Deleted
              {deletedItems.length > 0 && (
                <span className="deleted-count">
                  {deletedItems.length}
                </span>
              )}
            </button>

            <button
              className="add-person-btn"
              onClick={() => {
                setDateGiven(
                  todayDate()
                );

                setShowAddPerson(
                  true
                );
              }}
            >
              + Add Person
            </button>
          </div>
        </div>

        {/* SEARCH */}

        <div className="search-box">
          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search customer by name, phone or address..."
            value={
              searchTerm
            }
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />

          {searchTerm && (
            <button
              className="clear-search"
              onClick={() =>
                setSearchTerm(
                  ""
                )
              }
            >
              ×
            </button>
          )}
        </div>

        {/* CUSTOMER LIST */}

        {filteredPeople.length ===
        0 ? (
          <div className="empty-state">
            <div>
              👥
            </div>

            <h3>
              {people.length ===
              0
                ? "No customers yet"
                : "No customer found"}
            </h3>

            <p>
              {people.length ===
              0
                ? "Add your first customer to start tracking loans."
                : "Try another name, phone number or address."}
            </p>
          </div>
        ) : (
          <div className="people-list">
            {filteredPeople.map(
              (
                person,
                index
              ) => (
                <div
                  className="person-row"
                  key={
                    person.id
                  }
                  onClick={() =>
                    setSelectedPerson(
                      person
                    )
                  }
                >
                  <div className="person-number">
                    {index + 1}
                  </div>

                  <div className="person-info">
                    <h3>
                      {
                        person.name
                      }
                    </h3>

                    <p>
                      {person.phone ||
                        "No phone number"}{" "}
                      •{" "}
                      {
                        person.loans
                          .length
                      }{" "}
                      loan
                      {person.loans
                        .length !==
                      1
                        ? "s"
                        : ""}
                    </p>

                    {person.address && (
                      <small className="person-address-preview">
                        📍 {person.address}
                      </small>
                    )}
                  </div>

                  <div className="person-right">
                    <div className="person-outstanding">
                      <span>
                        Outstanding
                      </span>

                      <strong>
                        {money(
                          person.outstanding
                        )}
                      </strong>
                    </div>

                    {Number(
                      person.interestDue ||
                        0
                    ) > 0.01 ? (
                      <div className="person-interest-due">
                        Interest Due{" "}
                        {money(
                          person.interestDue
                        )}
                      </div>
                    ) : (
                      <div className="person-no-interest">
                        ✓ No Dues
                      </div>
                    )}
                  </div>

                  <div className="arrow">
                    →
                  </div>
                </div>
              )
            )}
          </div>
        )}

      {/* ADD PERSON MODAL */}

      {showAddPerson && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                Add Person
              </h2>

              <button
                onClick={() =>
                  setShowAddPerson(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleAddPerson
              }
            >
              <div className="input-group">
                <label>
                  Name
                </label>

                <input
                  type="text"
                  placeholder="Customer name"
                  value={
                    personName
                  }
                  onChange={(e) =>
                    setPersonName(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>
                  Phone
                </label>

                <input
                  type="tel"
                  placeholder="Phone number"
                  value={
                    phone
                  }
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label>
                  Address
                </label>

                <textarea
                  rows="3"
                  placeholder="Enter customer address"
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  className="address-textarea"
                />
              </div>

              <div className="form-section-title">
                First Loan
              </div>

              <div className="input-group">
                <label>
                  Loan Amount
                </label>

                <input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={
                    amount
                  }
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>
                  Date Given
                </label>

                <input
                  type="date"
                  value={
                    dateGiven
                  }
                  onChange={(e) =>
                    setDateGiven(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>
                  Monthly Interest Rate (%)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 3"
                  value={
                    interestRate
                  }
                  onChange={(e) =>
                    setInterestRate(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label>
                  Note
                </label>

                <input
                  type="text"
                  placeholder="Optional note"
                  value={
                    note
                  }
                  onChange={(e) =>
                    setNote(
                      e.target.value
                    )
                  }
                />
              </div>

              <button
                className="primary-btn"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : "Add Person"}
              </button>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}

export default App;
