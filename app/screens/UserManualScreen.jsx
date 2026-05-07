import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { normalizeRoleId, ROLE_IDS, getRoleLabel } from "../constants/roles";
import ScreenHeader from "./ScreenHeader";

const C = {
  bg: "#F0F2F5", surface: "#FFFFFF", navy: "#0B1F3A", steel: "#1E4D8C",
  gold: "#C9A84C", text: "#0B1F3A", textMute: "#8A9BB0", border: "#DDE3EC",
  success: "#1A7A4A", successBg: "#EAF6EF", infoBg: "#E6F2FA", info: "#155E8A",
};

// ─── Shared sections (all roles) ───────────────────────────────────────────

const GETTING_STARTED = [
  {
    title: "Registering an Account",
    icon: "person-add-outline",
    steps: [
      "Open the ManageIT app on your device.",
      'On the login screen, tap "Sign up now".',
      "Fill in your Personal Information — First Name, Last Name, Middle Initial, and Suffix (optional).",
      "Fill in your Account Information — Username, Email Address, and Contact Number.",
      "Fill in your Work Information — Select Office, Position, and Role.",
      "Enter your Password and Confirm Password under the Security section.",
      'Tap "Create Account".',
      'A "Registration Submitted!" screen will appear confirming that your account is pending admin approval.',
    ],
    note: "Your account will remain inactive until approved by the System Admin. You will be notified via email once approved.",
    images: [
      require("../../assets/images/screenshots/loginScreen.png"),
      require("../../assets/images/screenshots/SignUp.png"),
      require("../../assets/images/screenshots/SignUp2.png"),
      require("../../assets/images/screenshots/registrationSubmitted.png"),
    ],
  },
  {
    title: "Logging In",
    icon: "log-in-outline",
    steps: [
      "Open the ManageIT app.",
      "Enter your Username and Password.",
      'Tap "Login".',
      "You will be redirected to your dashboard upon success.",
    ],
    images: [
      require("../../assets/images/screenshots/loginScreen.png"),
    ],
  },
  {
    title: "Logging Out",
    icon: "log-out-outline",
    steps: [
      'Go to the "Profile" tab.',
      'Tap the "Logout" button.',
      "Confirm the logout.",
      "You will be redirected back to the login screen.",
    ],
  },
];

const TROUBLESHOOTING = [
  { problem: "Cannot log in", solution: "Double-check your username and password. Contact the System Admin if you forgot your password." },
  { problem: "Account not yet active", solution: "Wait for the System Admin to approve your account." },
  { problem: "App cannot connect to server", solution: "Contact your System Admin to check if the backend server is running." },
  { problem: "Push notifications not received", solution: "Go to device Settings → Apps → ManageIT → Notifications and enable them." },
  { problem: "App is loading for too long", solution: "Check your internet connection and try again." },
  { problem: "APK won't install", solution: "Go to Settings → Security → Enable Install from Unknown Sources." },
];

const FAQ = [
  { q: "Can I use ManageIT on an iPhone?", a: "The app is primarily designed for Android devices. iOS support may be added in a future version." },
  { q: "Do I need internet to use the app?", a: "Yes. The app requires an active internet connection for all features." },
  { q: "What should I do if I forgot my password?", a: "Contact your System Admin to reset your password." },
  { q: "Why am I not receiving push notifications?", a: "Make sure notifications are enabled for ManageIT in your device settings and that you have an active internet connection." },
];

// ─── Role-specific guide content ────────────────────────────────────────────

const ROLE_GUIDE = {
  [ROLE_IDS.REQUESTER]: [
    {
      title: "Submitting a Maintenance Request",
      icon: "add-circle-outline",
      steps: [
        'From the dashboard, tap "New Request".',
        "Select a Maintenance Type from the dropdown list.",
        "Enter the Location of the issue.",
        "Enter a Description of the problem.",
        'Tap "Submit".',
        "A confirmation message will appear when submitted successfully.",
      ],
      note: "Provide a clear and accurate description and location to help the GSO staff address the issue properly.",
    },
    {
      title: "Viewing Your Requests",
      icon: "list-outline",
      steps: [
        'Tap the "Requests" tab in the bottom navigation bar.',
        "Your submitted requests will be listed with their current status.",
        "Use the filter buttons at the top to filter by status: All, Pending, Approved, Done, Disapproved, or Cancelled.",
        "Tap on any request to view its full details.",
      ],
    },
    {
      title: "Cancelling a Request",
      icon: "close-circle-outline",
      steps: [
        'Go to the "Requests" tab.',
        "Find the request you want to cancel. It must be in Pending status.",
        "Tap the request to open its details.",
        'Tap "Cancel Request".',
        "Confirm the cancellation.",
      ],
      note: "Only requests with Pending status can be cancelled.",
    },
    {
      title: "Submitting Feedback",
      icon: "chatbubble-outline",
      steps: [
        'Go to the "Requests" tab.',
        'Find a request with "Done" status.',
        "Tap the request to open its details.",
        'Tap "Submit Feedback".',
        "Enter your rating and comments.",
        'Tap "Submit".',
      ],
    },
  ],

  [ROLE_IDS.HEAD]: [
    {
      title: "Viewing Requests for Review",
      icon: "documents-outline",
      steps: [
        'From the dashboard, tap "Review Requests".',
        "A list of maintenance requests pending your review will appear.",
        "Tap any request to view its full details.",
      ],
    },
    {
      title: "Approving a Request",
      icon: "checkmark-circle-outline",
      steps: [
        "Open the request you want to approve.",
        "Review the maintenance type, location, and description.",
        'Tap "Approve".',
        "The request will proceed to the Campus Director for final approval.",
        "The requester will be notified.",
      ],
    },
    {
      title: "Disapproving a Request",
      icon: "close-circle-outline",
      steps: [
        "Open the request you want to disapprove.",
        'Tap "Disapprove".',
        "Enter the reason for disapproval.",
        'Tap "Confirm".',
        "The request will be terminated and the requester will be notified with the reason.",
      ],
    },
  ],

  [ROLE_IDS.CAMPUS_DIRECTOR]: [
    {
      title: "Viewing Requests for Final Approval",
      icon: "documents-outline",
      steps: [
        'From the dashboard, tap "Review Requests".',
        "Requests already approved by the Head will appear.",
        "Tap any request to view its full details.",
      ],
    },
    {
      title: "Giving Final Approval",
      icon: "checkmark-done-circle-outline",
      steps: [
        "Open the request you want to approve.",
        "Review the details carefully.",
        'Tap "Approve".',
        "The request will be forwarded to the Staff for scheduling.",
        "The requester and Staff will be notified.",
      ],
    },
    {
      title: "Disapproving a Request",
      icon: "close-circle-outline",
      steps: [
        "Open the request you want to disapprove.",
        'Tap "Disapprove".',
        "Enter the reason for disapproval.",
        'Tap "Confirm".',
        "The request will be terminated and the requester will be notified.",
      ],
    },
  ],

  [ROLE_IDS.STAFF]: [
    {
      title: "Viewing Approved Requests",
      icon: "list-outline",
      steps: [
        'From the dashboard, tap "Review Requests".',
        "Fully approved requests ready for scheduling will appear.",
        "Tap any request to view its details.",
      ],
    },
    {
      title: "Assigning a Schedule",
      icon: "calendar-outline",
      steps: [
        "Open the approved request you want to schedule.",
        'Tap "Assign Schedule".',
        "Select a Date from the calendar. Past dates are disabled.",
        "Select a Time Slot (available from 7:00 AM to 4:00 PM).",
        "Enter optional Notes for additional context.",
        'Tap "Submit".',
        "The request status will be updated to Scheduled and all parties will be notified.",
      ],
    },
  ],

  [ROLE_IDS.SYSTEM_ADMIN]: [
    {
      title: "Viewing Pending Account Approvals",
      icon: "people-outline",
      steps: [
        'From the dashboard, tap "Pending Approvals".',
        "A list of newly registered accounts will appear.",
        "Tap any account to view its details.",
      ],
    },
    {
      title: "Approving a User Account",
      icon: "person-add-outline",
      steps: [
        "Open the account you want to approve.",
        "Assign the user's Office or Department.",
        "Assign the user's Position.",
        'Tap "Approve".',
        "The account will become active and the user will be notified.",
      ],
    },
    {
      title: "Rejecting a User Account",
      icon: "person-remove-outline",
      steps: [
        "Open the account you want to reject.",
        'Tap "Disapprove".',
        "Enter the reason for rejection.",
        'Tap "Confirm".',
        "The account will remain inactive and the user will be notified.",
      ],
    },
    {
      title: "Managing User Accounts",
      icon: "settings-outline",
      steps: [
        'From the dashboard, tap "User Management".',
        "A full list of all registered users will appear with their roles and statuses.",
        "Tap any user to view their details.",
      ],
    },
  ],
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function GuideCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardTop} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <View style={styles.cardTitleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name={item.icon} size={18} color={C.gold} />
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={C.textMute} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardBody}>
          {item.images && item.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }} contentContainerStyle={{ gap: 8 }}>
              {item.images.map((img, i) => (
                <Image key={i} source={img} style={styles.screenshot} resizeMode="contain" />
              ))}
            </ScrollView>
          )}
          {item.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          {item.note && (
            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={14} color={C.info} style={{ marginRight: 6 }} />
              <Text style={styles.noteText}>{item.note}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function TroubleshootCard({ item }) {
  return (
    <View style={styles.troubleCard}>
      <Text style={styles.troubleProblem}>{item.problem}</Text>
      <Text style={styles.troubleSolution}>{item.solution}</Text>
    </View>
  );
}

function FaqCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardTop} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <Text style={[styles.cardTitle, { flex: 1 }]}>{item.q}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={C.textMute} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardBody}>
          <Text style={styles.stepText}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Tab pill ────────────────────────────────────────────────────────────────

const TABS = ["Getting Started", "User Guide", "Troubleshooting", "FAQ"];

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function UserManualScreen({ user, onBack }) {
  const roleId = normalizeRoleId(user?.role_id);
  const roleLabel = getRoleLabel(roleId);
  const guide = ROLE_GUIDE[roleId] || [];
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={styles.root}>
      <ScreenHeader title="User Manual" onBack={onBack} />

      {/* Role badge */}
      <View style={styles.roleBanner}>
        <Ionicons name="person-circle-outline" size={16} color={C.gold} style={{ marginRight: 6 }} />
        <Text style={styles.roleBannerText}>Viewing guide for: </Text>
        <Text style={styles.roleBannerRole}>{roleLabel}</Text>
      </View>

      {/* Tab pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Tab 0 — Getting Started */}
        {activeTab === 0 && (
          <View>
            <SectionHeader title="Getting Started" />
            <Text style={styles.introText}>
              These steps apply to all users. Follow them to register, log in, and log out of ManageIT.
            </Text>
            {GETTING_STARTED.map((item, i) => <GuideCard key={i} item={item} />)}
          </View>
        )}

        {/* Tab 1 — Role-specific Guide */}
        {activeTab === 1 && (
          <View>
            <SectionHeader title={`${roleLabel} Guide`} />
            <Text style={styles.introText}>
              The following instructions are specific to your role as {roleLabel}.
            </Text>
            {guide.length > 0
              ? guide.map((item, i) => <GuideCard key={i} item={item} />)
              : <Text style={styles.emptyText}>No specific guide available for your role.</Text>
            }
          </View>
        )}

        {/* Tab 2 — Troubleshooting */}
        {activeTab === 2 && (
          <View>
            <SectionHeader title="Troubleshooting" />
            <Text style={styles.introText}>
              Having issues? Find common problems and their solutions below.
            </Text>
            {TROUBLESHOOTING.map((item, i) => <TroubleshootCard key={i} item={item} />)}
          </View>
        )}

        {/* Tab 3 — FAQ */}
        {activeTab === 3 && (
          <View>
            <SectionHeader title="Frequently Asked Questions" />
            {FAQ.map((item, i) => <FaqCard key={i} item={item} />)}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  roleBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.navy, paddingHorizontal: 16, paddingVertical: 10,
  },
  roleBannerText: { color: "#8A9BB0", fontSize: 12 },
  roleBannerRole: { color: C.gold, fontSize: 12, fontWeight: "800" },

  tabBar: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, maxHeight: 48 },
  tabBarContent: { paddingHorizontal: 12, alignItems: "center", gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  tabActive: { backgroundColor: C.navy },
  tabText: { fontSize: 12, fontWeight: "700", color: C.textMute },
  tabTextActive: { color: "#fff" },

  content: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },

  sectionHeader: {
    backgroundColor: C.navy, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, marginBottom: 10,
  },
  sectionHeaderText: { color: C.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  introText: { fontSize: 13, color: C.textMute, marginBottom: 12, lineHeight: 20 },

  card: {
    backgroundColor: C.surface, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(201,168,76,0.12)", alignItems: "center",
    justifyContent: "center", marginRight: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: C.text, flex: 1 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: C.border },

  screenshot: { width: 180, height: 320, borderRadius: 8, backgroundColor: C.bg },

  stepRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 10 },
  stepBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.navy,
    alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1,
  },
  stepNum: { color: C.gold, fontSize: 11, fontWeight: "800" },
  stepText: { fontSize: 13, color: C.text, flex: 1, lineHeight: 20 },

  noteBox: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: C.infoBg,
    borderRadius: 8, padding: 10, marginTop: 12,
  },
  noteText: { fontSize: 12, color: C.info, flex: 1, lineHeight: 18 },

  troubleCard: {
    backgroundColor: C.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 4, borderLeftColor: C.steel,
  },
  troubleProblem: { fontSize: 13, fontWeight: "800", color: C.text, marginBottom: 4 },
  troubleSolution: { fontSize: 13, color: C.textMute, lineHeight: 20 },

  emptyText: { fontSize: 13, color: C.textMute, textAlign: "center", marginTop: 20 },
});