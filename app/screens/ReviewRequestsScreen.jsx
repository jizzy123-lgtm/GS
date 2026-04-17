import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";
import { MAINTENANCE_STATUS, normalizeMaintenanceStatus } from "../constants/maintenanceStatus";
import { normalizeRoleId, ROLE_IDS } from "../constants/roles";

import { API_URL } from '../../api';
const C = { navy: "#0B1F3A", steel: "#1E4D8C", gold: "#C9A84C", bg: "#F0F2F5", surface: "#FFFFFF", surfaceAlt: "#F7F9FC", border: "#DDE3EC", textMute: "#8A9BB0", danger: "#9B1C1C", dangerBg: "#FEE8E8", success: "#1A7A4A", successBg: "#EAF6EF", warn: "#B45C10", warnBg: "#FEF3E2", info: "#155E8A", infoBg: "#E6F2FA" };
const SM = {
  [MAINTENANCE_STATUS.PENDING]: { color: C.warn, bg: C.warnBg, label: "Pending" },
  [MAINTENANCE_STATUS.APPROVED]: { color: C.success, bg: C.successBg, label: "Approved" },
  [MAINTENANCE_STATUS.DONE]: { color: C.navy, bg: C.surfaceAlt, label: "Done" },
  [MAINTENANCE_STATUS.DISAPPROVED]: { color: C.danger, bg: C.dangerBg, label: "Disapproved" },
  [MAINTENANCE_STATUS.CANCELLED]: { color: C.textMute, bg: C.surfaceAlt, label: "Cancelled" },
};
const FILTERS = ["All", "Pending", "Approved", "Done", "Disapproved", "Cancelled"];

const sortRequestsDescending = (list) => {
  const getTimestamp = (request) => {
    const value = request?.created_at || request?.date_requested || request?.updated_at;
    const ts = Date.parse(value || "");
    return Number.isNaN(ts) ? -Infinity : ts;
  };

  return [...list].sort((a, b) => {
    const byDate = getTimestamp(b) - getTimestamp(a);
    if (byDate !== 0) return byDate;
    return Number(b?.id || 0) - Number(a?.id || 0);
  });
};

const hasAny = (...values) => values.some((v) => Boolean(v));

const isRoleHeadLike = (value) => {
  const text = String(value || "").toLowerCase();
  return text.includes("head") && !text.includes("director");
};

const requesterIsHead = (request) => {
  const possibleRoleIds = [
    request?.requester_role_id,
    request?.requesting_personnel_role_id,
    request?.requester?.role_id,
    request?.requesting_personnel?.role_id,
    request?.requester?.role?.id,
    request?.requesting_personnel?.role?.id,
    request?.user?.role_id,
    request?.user?.role?.id,
  ];
  if (possibleRoleIds.some((value) => Number(value) === ROLE_IDS.HEAD)) return true;

  const possibleRoleLabels = [
    request?.requester_role_name,
    request?.requesting_personnel_role_name,
    request?.requester?.role_name,
    request?.requester?.role?.role_name,
    request?.requesting_personnel?.role?.role_name,
    request?.user?.role_name,
    request?.user?.role?.role_name,
  ];
  return possibleRoleLabels.some((value) => isRoleHeadLike(value));
};

const isVerifiedByStaff = (request) =>
  hasAny(
    request?.verified_by,
    request?.verifier,
    request?.verified_at,
    request?.date_received,
    request?.time_received
  );

const isHeadApproved = (request) =>
  hasAny(
    request?.approved_by_1,
    request?.approved_by_head,
    request?.head_approved_by,
    request?.head_approved_at,
    request?.approver1,
    request?.head_approver
  );

const isDirectorApproved = (request) =>
  hasAny(
    request?.approved_by_2,
    request?.approved_by_director,
    request?.director_approved_by,
    request?.director_approved_at,
    request?.approver2,
    request?.director_approver
  );

export default function ReviewRequestsScreen({ user, onBack, onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [rejectId, setRejectId] = useState(null);
  const [rejectMode, setRejectMode] = useState("disapprove");
  const [rejectReason, setRejectReason] = useState("");
  const [priorityTarget, setPriorityTarget] = useState(null);
  const [priorityNumber, setPriorityNumber] = useState("");
  const [priorityLoading, setPriorityLoading] = useState(false);
  const roleId = normalizeRoleId(user?.role_id);

  const fetchRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const ep = "/maintenance-requests";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      let res;
      try {
        res = await fetch(`${API_URL}${ep}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
      const data = await res.json();
      const reqList = Array.isArray(data) ? data : data.data || [];

      // Fetch maintenance types if not loaded
      let currentTypes = types;
      if (Object.keys(currentTypes).length === 0) {
        const tRes = await fetch(`${API_URL}/maintenance-types`, { headers: { Authorization: `Bearer ${token}` } });
        const tData = await tRes.json();
        const tList = Array.isArray(tData) ? tData : tData.data || [];
        const tMap = {};
        tList.forEach(t => tMap[t.id] = t.name || t.type_name);
        setTypes(tMap);
        currentTypes = tMap;
      }

      setRequests(sortRequestsDescending(reqList.map(r => ({
        ...r,
        status: normalizeMaintenanceStatus(r.status, r.status_id),
        maintenance_type_name: currentTypes[r.maintenance_type_id] || r.maintenance_type?.name || r.maintenance_type || r.type
      }))));
    } catch (_e) { setRequests([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchRequests(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  const getSequentialPendingRequests = (reqs, role) => {
    const pendingReqs = reqs.filter(r => r.status === MAINTENANCE_STATUS.PENDING);
    if (role === ROLE_IDS.STAFF) {
      return pendingReqs.filter(r => !isVerifiedByStaff(r));
    }
    if (role === ROLE_IDS.HEAD) {
      return pendingReqs.filter(r => isVerifiedByStaff(r) && !isHeadApproved(r));
    }
    if (role === ROLE_IDS.CAMPUS_DIRECTOR) {
      return pendingReqs.filter(r => isHeadApproved(r) && !isDirectorApproved(r));
    }
    return pendingReqs;
  };

  const roleNeedsSequentialFilter = [ROLE_IDS.STAFF, ROLE_IDS.HEAD, ROLE_IDS.CAMPUS_DIRECTOR].includes(roleId);

  const filtered = (() => {
    if (filter === "All") {
      if (roleId === ROLE_IDS.STAFF) {
        // Staff sees ALL requests so they can track verified ones waiting for Head/Director
        return requests;
      }
      if (roleNeedsSequentialFilter) {
        const nonPending = requests.filter(r => r.status !== MAINTENANCE_STATUS.PENDING);
        return sortRequestsDescending([...getSequentialPendingRequests(requests, roleId), ...nonPending]);
      }
      return requests;
    }
    if (filter === "Pending") {
      if (roleId === ROLE_IDS.STAFF) {
        // Pending tab for staff shows all pending requests (including verified ones)
        return requests.filter(r => r.status === MAINTENANCE_STATUS.PENDING);
      }
      if (roleNeedsSequentialFilter) {
        return getSequentialPendingRequests(requests, roleId);
      }
    }
    return requests.filter(r => {
      const s = normalizeMaintenanceStatus(r.status, r.status_id);
      return s === filter.toLowerCase();
    });
  })();

  const doAction = async (id, action, reason = "", extra = {}) => {
    setActionLoading(true); setActionMsg("");
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      let endpoint = "";
      let payload = {};
      const now = new Date();
      const dateReceived = now.toISOString().slice(0, 10);
      const timeReceived = now.toTimeString().slice(0, 8);
      const userId = Number(user?.id || user?.user_id || 0);

      if (action === "verify") {
        if (roleId !== ROLE_IDS.STAFF) {
          setActionMsg("Only Staff can verify requests.");
          return;
        }
        if (!userId) {
          setActionMsg("Unable to verify request: missing staff user id.");
          return;
        }
        endpoint = `/maintenance-requests/${id}/verify`;
        payload = {
          date_received: dateReceived,
          time_received: timeReceived,
          verified_by: userId,
          comment: reason || "Verified by staff",
        };
      } else if (action === "approve") {
        if (roleId === ROLE_IDS.HEAD) {
          endpoint = `/maintenance-requests/${id}/approve-head`;
        } else if (roleId === ROLE_IDS.CAMPUS_DIRECTOR) {
          endpoint = `/maintenance-requests/${id}/approve-director`;
        } else {
          setActionMsg("Only Head or Campus Director can approve requests.");
          return;
        }
        payload = { comment: reason || "Approved" };
      } else if (action === "disapprove") {
        if (![ROLE_IDS.HEAD, ROLE_IDS.CAMPUS_DIRECTOR].includes(roleId)) {
          setActionMsg("Only Head or Campus Director can disapprove requests.");
          return;
        }
        endpoint = `/maintenance-requests/${id}/disapprove`;
        payload = { comment: reason || "Disapproved" };
      } else if (action === "deny") {
        if (roleId !== ROLE_IDS.STAFF) {
          setActionMsg("Only Staff can deny requests.");
          return;
        }
        endpoint = `/maintenance-requests/${id}/deny`;
        payload = {
          date_received: dateReceived,
          time_received: timeReceived,
          comment: reason || "Denied by staff",
        };
      } else if (action === "assignPriority") {
        if (roleId !== ROLE_IDS.STAFF) {
          setActionMsg("Only Staff can assign priority.");
          return;
        }
        const finalPriorityNumber = String(extra.priority_number || "").trim();
        if (!finalPriorityNumber) {
          setActionMsg("Priority number is required.");
          return;
        }
        endpoint = `/maintenance-requests/${id}/assign-priority`;
        payload = { priority_number: finalPriorityNumber };
      } else if (action === "markDone") {
        if (roleId !== ROLE_IDS.STAFF) {
          setActionMsg("Only Staff can mark requests as done.");
          return;
        }
        endpoint = `/maintenance-requests/${id}/mark-done`;
      } else {
        setActionMsg("Unsupported action.");
        return;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg(data?.message || `Failed to ${action}.`);
        return;
      }

      const successMap = {
        verify: "Request verified successfully.",
        approve: "Request approved successfully.",
        disapprove: "Request disapproved successfully.",
        deny: "Request denied successfully.",
        assignPriority: "Priority assigned successfully.",
        markDone: "Request marked as done.",
      };

      setActionMsg(successMap[action] || "Action completed.");
      fetchRequests();
      setSelected(null);
      setRejectId(null);
      setRejectReason("");
      setRejectMode("disapprove");
      setPriorityTarget(null);
      setPriorityNumber("");
    } catch (_e) { setActionMsg("Cannot connect to server."); }
    finally { setActionLoading(false); }
  };

  const generatePriorityNumber = async (request) => {
    const maintenanceTypeId = Number(request?.maintenance_type_id || request?.maintenance_type?.id || 0);
    if (!maintenanceTypeId) {
      setActionMsg("Cannot generate priority number: missing maintenance type.");
      return;
    }

    setPriorityLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/generate-priority-number/${maintenanceTypeId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        setActionMsg(data?.message || "Failed to generate priority number.");
        return;
      }

      const generated = data?.priority_number || data?.data?.priority_number || data?.data || "";
      if (!generated) {
        setActionMsg("No priority number was returned by the server.");
        return;
      }
      setPriorityNumber(String(generated));
    } catch (_e) {
      setActionMsg("Cannot connect to server.");
    } finally {
      setPriorityLoading(false);
    }
  };

  if (selected) {
    const currentStatus = normalizeMaintenanceStatus(selected.status, selected.status_id);
    const s = SM[currentStatus] || SM[MAINTENANCE_STATUS.PENDING];
    const pending = currentStatus === MAINTENANCE_STATUS.PENDING;
    const approved = currentStatus === MAINTENANCE_STATUS.APPROVED;
    const isHead = roleId === ROLE_IDS.HEAD;
    const isDirector = roleId === ROLE_IDS.CAMPUS_DIRECTOR;
    const isStaff = roleId === ROLE_IDS.STAFF;

    const requesterHead = requesterIsHead(selected);
    const verified = isVerifiedByStaff(selected);
    const headApproved = isHeadApproved(selected);
    const directorApproved = isDirectorApproved(selected);

    const canHeadApprove = isHead && pending && verified && !requesterHead && !headApproved;
    const canDirectorApprove = isDirector && pending && verified && (requesterHead || headApproved) && !directorApproved;
    const canApprove = canHeadApprove || canDirectorApprove;
    const canDisapprove = canHeadApprove || canDirectorApprove;
    const canVerify = isStaff && pending && !verified;
    const canDeny = isStaff && pending && !verified;
    const canAssignPriority = isStaff && pending && directorApproved;
    const canAssignSchedule = isStaff && approved;
    const canMarkDone = isStaff && approved && Boolean(selected.scheduled_date);
    const waitingForVerification = [ROLE_IDS.HEAD, ROLE_IDS.CAMPUS_DIRECTOR].includes(roleId) && pending && !verified;
    const waitingForHead = isDirector && pending && verified && !requesterHead && !headApproved;
    const actionError = /failed|cannot|only|unable|required|missing/i.test(String(actionMsg || ""));

    const openPriorityModal = () => {
      setPriorityTarget(selected);
      setPriorityNumber(String(selected.priority_number || selected.priority || ""));
    };

    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScreenHeader title="Request Details" onBack={() => { setSelected(null); setActionMsg(""); }} backLabel="Back to List" />
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          {waitingForVerification && (
            <View style={[styles.msgBox, { borderLeftColor: C.warn, backgroundColor: C.warnBg }]}>
              <Text style={[styles.msgText, { color: C.warn }]}>Waiting for staff verification.</Text>
            </View>
          )}
          {waitingForHead && (
            <View style={[styles.msgBox, { borderLeftColor: C.warn, backgroundColor: C.warnBg }]}>
              <Text style={[styles.msgText, { color: C.warn }]}>Waiting for head approval before director approval.</Text>
            </View>
          )}
          {actionMsg ? (
            <View style={[styles.msgBox, { borderLeftColor: actionError ? C.danger : C.success, backgroundColor: actionError ? C.dangerBg : C.successBg }]}>
              <Text style={[styles.msgText, { color: actionError ? C.danger : C.success }]}>{actionMsg}</Text>
            </View>
          ) : null}
          <View style={[styles.statusBanner, { backgroundColor: s.bg, borderLeftColor: s.color }]}>
            <Text style={[styles.statusBannerText, { color: s.color }]}>{s.label}</Text>
          </View>
          <View style={styles.detailCard}>
            {[
              ["Request ID", `#${selected.id}`],
              ["Type", selected.maintenance_type_name || selected.maintenance_type?.name || selected.maintenance_type || selected.type],
              ["Priority", selected.priority_number || selected.priority || "Pending priority assignment"],
              ["Location", selected.location],
              ["Submitted by", selected.requester_name || selected.user?.name || selected.requester?.name],
              ["Date", (selected.date_requested || selected.created_at)?.slice(0, 10)],
              ["Description", selected.details || selected.description]
            ].map(([l, v], i, arr) => (
              <View key={i} style={[styles.dRow, i === arr.length - 1 && !verified && { borderBottomWidth: 0 }]}>
                <Text style={styles.dLabel}>{l}</Text>
                <Text style={styles.dValue}>{v || "-"}</Text>
              </View>
            ))}
            {verified && (
              <View style={styles.dRow}>
                <Text style={styles.dLabel}>Verified by Staff</Text>
                <Text style={[styles.dValue, { color: C.info }]}>{selected.verifier?.last_name || selected.verified_by_name || "Staff"}</Text>
              </View>
            )}
            {headApproved && (
              <View style={[styles.dRow, !directorApproved && { borderBottomWidth: 0 }]}>
                <Text style={styles.dLabel}>Approved by Head</Text>
                <Text style={[styles.dValue, { color: C.success }]}>{selected.approver1?.last_name || "Head"}</Text>
              </View>
            )}
            {directorApproved && (
              <View style={[styles.dRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.dLabel}>Approved by Director</Text>
                <Text style={[styles.dValue, { color: C.success }]}>{selected.approver2?.last_name || "Campus Director"}</Text>
              </View>
            )}
          </View>
          <View style={styles.approvalCard}>
            <Text style={styles.approvalCardTitle}>Approval Progress</Text>
            <View style={styles.approvalSteps}>
              <ApprovalStepDetail
                done={verified}
                label="Staff Verified"
                who={selected.verifier?.last_name || selected.verified_by_name || null}
                date={selected.verified_at || selected.date_received || null}
              />
              <View style={[styles.approvalStepLine, { backgroundColor: headApproved ? C.success : C.border }]} />
              <ApprovalStepDetail
                done={headApproved}
                label="Head Approved"
                who={selected.approver1?.last_name || selected.approved_by_head || null}
                date={selected.head_approved_at || null}
              />
              <View style={[styles.approvalStepLine, { backgroundColor: directorApproved ? C.success : C.border }]} />
              <ApprovalStepDetail
                done={directorApproved}
                label="Director Approved"
                who={selected.approver2?.last_name || selected.approved_by_director || null}
                date={selected.director_approved_at || null}
              />
            </View>
          </View>

          {selected.scheduled_date && (
            <View style={styles.schedCard}>
              <Text style={styles.schedTitle}>Assigned Schedule</Text>
              {[["Date", selected.scheduled_date], ["Time", selected.scheduled_time], ["Staff", selected.assigned_staff]].map(([l, v], i, arr) => (
                <View key={i} style={[styles.dRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.dLabel}>{l}</Text>
                  <Text style={styles.dValue}>{v || "-"}</Text>
                </View>
              ))}
            </View>
          )}
          {isStaff && pending && (
            <View style={styles.actionRow}>
              {canVerify && (
                <TouchableOpacity style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]} onPress={() => doAction(selected.id, "verify")} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.approveBtnText}>VERIFY</Text>}
                </TouchableOpacity>
              )}
              {canDeny && (
                <TouchableOpacity
                  style={[styles.disapproveBtn, actionLoading && { opacity: 0.6 }, !canVerify && { flex: 1 }]}
                  onPress={() => { setRejectMode("deny"); setRejectId(selected.id); }}
                  disabled={actionLoading}
                >
                  <Text style={styles.disapproveBtnText}>DENY</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {canApprove && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]} onPress={() => doAction(selected.id, "approve")} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.approveBtnText}>APPROVE</Text>}
              </TouchableOpacity>
              {canDisapprove && (
                <TouchableOpacity
                  style={[styles.disapproveBtn, actionLoading && { opacity: 0.6 }]}
                  onPress={() => { setRejectMode("disapprove"); setRejectId(selected.id); }}
                  disabled={actionLoading}
                >
                  <Text style={styles.disapproveBtnText}>DISAPPROVE</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {canAssignPriority && (
            <TouchableOpacity style={styles.assignBtn} onPress={openPriorityModal} activeOpacity={0.85}>
              <Text style={styles.assignBtnText}>ASSIGN PRIORITY</Text>
            </TouchableOpacity>
          )}
          {canAssignSchedule && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => onNavigate("AssignSchedule", { requestId: selected.id, request: selected })} activeOpacity={0.85}>
              <Text style={styles.assignBtnText}>ASSIGN SCHEDULE</Text>
            </TouchableOpacity>
          )}
          {canMarkDone && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => doAction(selected.id, "markDone")} activeOpacity={0.85}>
              <Text style={styles.assignBtnText}>MARK AS DONE</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {rejectId && (
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{rejectMode === "deny" ? "Deny Request" : "Disapprove Request"}</Text>
              <Text style={styles.modalLabel}>Please provide a reason (required):</Text>
              <TextInput
                style={styles.input}
                multiline
                numberOfLines={4}
                placeholder="Type reason here..."
                value={rejectReason}
                onChangeText={setRejectReason}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRejectId(null); setRejectReason(""); setRejectMode("disapprove"); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, (!rejectReason.trim() || actionLoading) && { opacity: 0.5 }]}
                  onPress={() => doAction(rejectId, rejectMode, rejectReason)}
                  disabled={!rejectReason.trim() || actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{rejectMode === "deny" ? "Confirm Denial" : "Confirm Disapproval"}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {priorityTarget && (
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Assign Priority Number</Text>
              <Text style={styles.modalLabel}>Priority number (required):</Text>
              <TextInput
                style={styles.input}
                value={priorityNumber}
                onChangeText={setPriorityNumber}
                placeholder="Enter priority number"
                placeholderTextColor={C.textMute}
              />
              <TouchableOpacity style={[styles.cancelBtn, { marginTop: 8 }]} onPress={() => generatePriorityNumber(priorityTarget)} disabled={priorityLoading}>
                {priorityLoading ? <ActivityIndicator color={C.steel} /> : <Text style={[styles.cancelBtnText, { color: C.steel }]}>Auto Generate</Text>}
              </TouchableOpacity>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPriorityTarget(null); setPriorityNumber(""); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, (!priorityNumber.trim() || actionLoading) && { opacity: 0.5 }]}
                  onPress={() => doAction(selected.id, "assignPriority", "", { priority_number: priorityNumber })}
                  disabled={!priorityNumber.trim() || actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Priority</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader
        title="Review Requests"
        subtitle={roleId === ROLE_IDS.STAFF ? "Verify, prioritize, and complete requests" : "Approve or disapprove pending requests"}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.steel} />}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ padding: 14 }}>
          {loading ? <ActivityIndicator color={C.steel} style={{ marginTop: 40 }} />
            : filtered.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>No {filter !== "All" ? filter.toLowerCase() : ""} requests.</Text></View>
              : filtered.map((req, i) => {
                const status = normalizeMaintenanceStatus(req.status, req.status_id);
                const s = SM[status] || SM[MAINTENANCE_STATUS.PENDING];
                const pending = status === MAINTENANCE_STATUS.PENDING;
                const approved = status === MAINTENANCE_STATUS.APPROVED;
                const verified = isVerifiedByStaff(req);
                const directorApproved = isDirectorApproved(req);
                return (
                  <TouchableOpacity key={i} style={[styles.reqCard, { borderLeftColor: s.color }]} onPress={() => setSelected(req)} activeOpacity={0.8}>
                    <View style={styles.reqCardTop}>
                      <Text style={styles.reqType} numberOfLines={1}>{req.maintenance_type_name || req.maintenance_type?.name || "Maintenance Request"}</Text>
                      <View style={[styles.chip, { backgroundColor: s.bg }]}>
                        <Text style={[styles.chipText, { color: s.color }]}>{s.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.reqMeta}>{req.location || "Office/Campus"} - {(req.date_requested || req.created_at)?.slice(0, 10) || "-"}</Text>
                    {roleId === ROLE_IDS.STAFF && (
                      <View style={styles.approvalTrack}>
                        <ApprovalStep done={verified} label="Verified" />
                        <View style={[styles.trackLine, { backgroundColor: isHeadApproved(req) ? C.success : C.border }]} />
                        <ApprovalStep done={isHeadApproved(req)} label="Head" />
                        <View style={[styles.trackLine, { backgroundColor: directorApproved ? C.success : C.border }]} />
                        <ApprovalStep done={directorApproved} label="Director" />
                      </View>
                    )}
                    {roleId === ROLE_IDS.STAFF && pending && !verified && (
                      <View style={styles.assignTag}><Text style={styles.assignTagText}>Needs Verification</Text></View>
                    )}
                    {roleId === ROLE_IDS.STAFF && pending && verified && !isHeadApproved(req) && (
                      <View style={[styles.assignTag, { backgroundColor: C.infoBg }]}><Text style={[styles.assignTagText, { color: C.info }]}>Waiting for Head Approval</Text></View>
                    )}
                    {roleId === ROLE_IDS.STAFF && pending && isHeadApproved(req) && !directorApproved && (
                      <View style={[styles.assignTag, { backgroundColor: C.infoBg }]}><Text style={[styles.assignTagText, { color: C.info }]}>Waiting for Director Approval</Text></View>
                    )}
                    {roleId === ROLE_IDS.STAFF && pending && verified && directorApproved && (
                      <View style={[styles.assignTag, { backgroundColor: C.warnBg }]}><Text style={[styles.assignTagText, { color: C.warn }]}>Needs Priority</Text></View>
                    )}
                    {roleId === ROLE_IDS.STAFF && approved && !req.scheduled_date && (
                      <View style={styles.assignTag}><Text style={styles.assignTagText}>Needs Schedule</Text></View>
                    )}
                    {req.scheduled_date && <Text style={styles.scheduledText}>Scheduled: {req.scheduled_date}</Text>}
                  </TouchableOpacity>
                );
              })}
        </View>
      </ScrollView>
    </View>
  );
}

function ApprovalStep({ done, label }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={[{ width: 16, height: 16, borderRadius: 8, borderWidth: 2 }, done ? { backgroundColor: C.success, borderColor: C.success } : { backgroundColor: C.surface, borderColor: C.border }]} />
      <Text style={{ fontSize: 9, color: done ? C.success : C.textMute, fontWeight: "700", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function ApprovalStepDetail({ done, label, who, date }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View style={{ alignItems: "center", paddingTop: 2 }}>
        <View style={[{ width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2 }, done ? { backgroundColor: C.success, borderColor: C.success } : { backgroundColor: C.surface, borderColor: C.border }]}>
          {done && <Text style={{ color: "#fff", fontSize: 11, fontWeight: "900" }}>✓</Text>}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: done ? C.navy : C.textMute }}>{label}</Text>
        {done && who ? <Text style={{ fontSize: 11, color: C.success, fontWeight: "600", marginTop: 1 }}>by {who}</Text> : null}
        {done && date ? <Text style={{ fontSize: 10, color: C.textMute, marginTop: 1 }}>{String(date).slice(0, 10)}</Text> : null}
        {!done && <Text style={{ fontSize: 11, color: C.textMute, marginTop: 1 }}>Pending</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  filterTabActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterTabText: { fontSize: 12, fontWeight: "700", color: C.textMute },
  filterTabTextActive: { color: "#fff" },
  emptyCard: { backgroundColor: C.surface, borderRadius: 12, padding: 36, alignItems: "center", borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 14, color: C.textMute, fontWeight: "600" },
  reqCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: C.border, elevation: 1 },
  reqCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reqType: { fontSize: 15, fontWeight: "700", color: C.navy, flex: 1 },
  reqMeta: { fontSize: 12, color: C.textMute, marginTop: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  chipText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  assignTag: { marginTop: 8, backgroundColor: C.infoBg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  assignTagText: { fontSize: 11, color: C.info, fontWeight: "700" },
  scheduledText: { fontSize: 11, color: C.success, fontWeight: "600", marginTop: 6 },
  approvalTrack: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  trackLine: { flex: 1, height: 2, marginHorizontal: 4 },
  approvalCard: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, elevation: 2 },
  approvalCardTitle: { fontSize: 11, fontWeight: "800", color: C.textMute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  approvalSteps: { gap: 12 },
  approvalStepLine: { width: 2, height: 16, marginLeft: 9 },
  msgBox: { borderLeftWidth: 4, borderRadius: 10, padding: 12, marginBottom: 12 },
  msgText: { fontSize: 13, fontWeight: "600" },
  statusBanner: { borderLeftWidth: 4, borderRadius: 8, padding: 14, marginBottom: 12 },
  statusBannerText: { fontSize: 16, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  detailCard: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, elevation: 2 },
  dRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  dLabel: { fontSize: 12, color: C.textMute, fontWeight: "600", flex: 1 },
  dValue: { fontSize: 13, color: C.navy, fontWeight: "700", flex: 2, textAlign: "right" },
  schedCard: { backgroundColor: C.successBg, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.success },
  schedTitle: { fontSize: 11, fontWeight: "800", color: C.success, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 6, marginBottom: 10 },
  approveBtn: { flex: 1, backgroundColor: C.success, borderRadius: 10, paddingVertical: 14, alignItems: "center", elevation: 3 },
  approveBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  disapproveBtn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: C.danger },
  disapproveBtnText: { color: C.danger, fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  assignBtn: { backgroundColor: C.steel, borderRadius: 10, paddingVertical: 15, alignItems: "center", elevation: 4, marginTop: 6 },
  assignBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
  modalBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: C.surface, borderRadius: 20, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: C.navy, marginBottom: 12 },
  modalLabel: { fontSize: 12, color: C.textMute, fontWeight: "600", marginBottom: 8 },
  input: { backgroundColor: C.surfaceAlt, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: C.navy, borderWidth: 1, borderColor: C.border, textAlignVertical: "top", marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: C.bg },
  cancelBtnText: { color: C.textMute, fontWeight: "800" },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: C.danger },
  saveBtnText: { color: "#fff", fontWeight: "800" },
});

