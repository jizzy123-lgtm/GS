import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";
const C={navy:"#0B1F3A",steel:"#1E4D8C",gold:"#C9A84C",bg:"#F0F2F5",surface:"#FFFFFF",border:"#DDE3EC",textMute:"#8A9BB0",danger:"#9B1C1C",dangerBg:"#FEE8E8",success:"#1A7A4A",successBg:"#EAF6EF",warn:"#B45C10",warnBg:"#FEF3E2",info:"#155E8A",infoBg:"#E6F2FA"};
const PRIORITIES=[{key:"low",label:"Low",color:C.success},{key:"medium",label:"Medium",color:C.warn},{key:"high",label:"High",color:C.danger},{key:"urgent",label:"Urgent",color:"#6B21A8"}];
const TIME_SLOTS=["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];

export default function AssignScheduleScreen({ user, requestId, request, onBack, onSuccess }) {
  const [confirmedRequests,setConfirmedRequests]=useState([]);
  const [selectedRequest,setSelectedRequest]=useState(request||null);
  const [loading,setLoading]=useState(!request);
  const [submitting,setSubmitting]=useState(false);
  const [success,setSuccess]=useState(false);
  const [error,setError]=useState("");
  const [scheduledDate,setScheduledDate]=useState("");
  const [scheduledTime,setScheduledTime]=useState("");
  const [assignedStaff,setAssignedStaff]=useState(`${user?.first_name||""} ${user?.last_name||""}`.trim());
  const [priority,setPriority]=useState(request?.priority||"medium");
  const [notes,setNotes]=useState("");

  useEffect(()=>{if(!request)fetchConfirmed();},[]);

  const fetchConfirmed=async()=>{
    setLoading(true);
    try{
      const token=await AsyncStorage.getItem("token");
      const res=await fetch(`${API_URL}/staff/requests`,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"},signal:AbortSignal.timeout(15000)});
      const data=await res.json();
      const all=Array.isArray(data)?data:data.data||[];
      setConfirmedRequests(all.filter(r=>["confirmed","approved"].includes(r.status?.toLowerCase())&&!r.scheduled_date));
    }catch(e){setConfirmedRequests([]);}
    finally{setLoading(false);}
  };

  const handleAssign=async()=>{
    setError("");
    if(!selectedRequest){setError("Please select a request.");return;}
    if(!scheduledDate.trim()){setError("Please enter a scheduled date.");return;}
    if(!scheduledTime){setError("Please select a time slot.");return;}
    if(!assignedStaff.trim()){setError("Please enter the staff name.");return;}
    setSubmitting(true);
    try{
      const token=await AsyncStorage.getItem("token");
      const res=await fetch(`${API_URL}/requests/${selectedRequest.id}/assign-schedule`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({scheduled_date:scheduledDate,scheduled_time:scheduledTime,assigned_staff:assignedStaff,priority,notes}),
      });
      const data=await res.json();
      if(res.ok) setSuccess(true);
      else setError(data.message||"Failed to assign schedule.");
    }catch(e){setError("Cannot connect to server.");}
    finally{setSubmitting(false);}
  };

  if(success) return(
    <View style={{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center",padding:24}}>
      <View style={styles.successBadge}><Text style={styles.successBadgeText}>✓</Text></View>
      <Text style={styles.successOrg}>GSU GATEWAY</Text>
      <Text style={styles.successTitle}>Schedule Assigned!</Text>
      <Text style={styles.successSub}>The requester will be notified of their schedule.</Text>
      <View style={styles.successCard}>
        <Text style={styles.successCardTitle}>Schedule Details</Text>
        {[["Request",selectedRequest?.maintenance_type||selectedRequest?.type],["Date",scheduledDate],["Time",scheduledTime],["Staff",assignedStaff],["Priority",priority]].map(([l,v],i,arr)=>(
          <View key={i} style={[styles.dRow,i===arr.length-1&&{borderBottomWidth:0}]}>
            <Text style={styles.dLabel}>{l}</Text>
            <Text style={styles.dValue}>{v||"—"}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.doneBtn} onPress={onSuccess} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>BACK TO DASHBOARD</Text>
      </TouchableOpacity>
    </View>
  );

  return(
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":"height"}>
      <ScreenHeader title="Assign Schedule" subtitle="Assign schedule for confirmed requests" onBack={onBack}/>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          {error?<View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>:null}

          {!request&&(
            <>
              <SLabel title="Select Request"/>
              {loading?<ActivityIndicator color={C.steel} style={{marginVertical:20}}/>
              :confirmedRequests.length===0?<View style={styles.emptyCard}><Text style={styles.emptyText}>No confirmed requests awaiting schedule.</Text></View>
              :confirmedRequests.map((req,i)=>(
                <TouchableOpacity key={i} style={[styles.reqCard,selectedRequest?.id===req.id&&styles.reqCardActive]} onPress={()=>{setSelectedRequest(req);setPriority(req.priority||"medium");}} activeOpacity={0.8}>
                  <Text style={styles.reqType}>{req.maintenance_type||req.type}</Text>
                  <Text style={styles.reqMeta}>{req.location} · {req.created_at?.slice(0,10)}</Text>
                  {selectedRequest?.id===req.id&&<View style={styles.selectedTag}><Text style={styles.selectedTagText}>Selected</Text></View>}
                </TouchableOpacity>
              ))}
            </>
          )}

          {selectedRequest&&(
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Selected Request</Text>
              <Text style={styles.summaryType}>{selectedRequest.maintenance_type||selectedRequest.type}</Text>
              <Text style={styles.summaryMeta}>{selectedRequest.location} · Priority: {selectedRequest.priority}</Text>
            </View>
          )}

          <SLabel title="Schedule Details"/>
          <Text style={styles.label}>Scheduled Date *</Text>
          <TextInput style={styles.input} placeholder="e.g. 2026-03-20" placeholderTextColor="#a0aec0" value={scheduledDate} onChangeText={setScheduledDate}/>

          <Text style={styles.label}>Time Slot *</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot,i)=>(
              <TouchableOpacity key={i} style={[styles.timeBtn,scheduledTime===slot&&styles.timeBtnActive]} onPress={()=>setScheduledTime(slot)} activeOpacity={0.8}>
                <Text style={[styles.timeBtnText,scheduledTime===slot&&styles.timeBtnTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Assigned Staff *</Text>
          <TextInput style={styles.input} placeholder="Staff name" placeholderTextColor="#a0aec0" value={assignedStaff} onChangeText={setAssignedStaff}/>

          <SLabel title="Priority Schedule"/>
          <View style={styles.priorityGrid}>
            {PRIORITIES.map(p=>(
              <TouchableOpacity key={p.key} style={[styles.priorityBtn,priority===p.key&&{backgroundColor:p.color,borderColor:p.color}]} onPress={()=>setPriority(p.key)} activeOpacity={0.8}>
                <Text style={[styles.priorityText,priority===p.key&&{color:"#fff"}]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput style={[styles.input,styles.textarea]} placeholder="Additional instructions..." placeholderTextColor="#a0aec0" value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top"/>

          <TouchableOpacity style={[styles.submitBtn,(submitting||!selectedRequest)&&{opacity:0.6}]} onPress={handleAssign} disabled={submitting||!selectedRequest} activeOpacity={0.85}>
            {submitting?<ActivityIndicator color="#fff"/>:<Text style={styles.submitText}>ASSIGN SCHEDULE</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SLabel({title}){
  return(
    <View style={styles.sLabel}>
      <View style={styles.sLabelAccent}/>
      <Text style={styles.sLabelText}>{title}</Text>
    </View>
  );
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},scroll:{paddingBottom:40},
  body:{padding:16},
  errorBox:{backgroundColor:C.dangerBg,borderLeftWidth:4,borderLeftColor:C.danger,borderRadius:10,padding:12,marginBottom:12},
  errorText:{color:C.danger,fontSize:13,fontWeight:"600"},
  sLabel:{flexDirection:"row",alignItems:"center",gap:8,marginTop:18,marginBottom:10},
  sLabelAccent:{width:4,height:16,backgroundColor:C.gold,borderRadius:2},
  sLabelText:{fontSize:12,fontWeight:"800",color:C.navy,textTransform:"uppercase",letterSpacing:1},
  emptyCard:{backgroundColor:C.surface,borderRadius:12,padding:24,alignItems:"center",borderWidth:1,borderColor:C.border,marginBottom:10},
  emptyText:{fontSize:14,color:C.textMute,fontWeight:"600"},
  reqCard:{backgroundColor:C.surface,borderRadius:10,padding:14,marginBottom:8,borderWidth:1.5,borderColor:C.border},
  reqCardActive:{borderColor:C.steel,backgroundColor:C.infoBg},
  reqType:{fontSize:14,fontWeight:"700",color:C.navy},
  reqMeta:{fontSize:12,color:C.textMute,marginTop:3},
  selectedTag:{marginTop:6,backgroundColor:C.steel,borderRadius:6,paddingHorizontal:10,paddingVertical:3,alignSelf:"flex-start"},
  selectedTagText:{fontSize:11,color:"#fff",fontWeight:"700"},
  summaryCard:{backgroundColor:C.infoBg,borderRadius:10,padding:14,marginBottom:4,borderLeftWidth:4,borderLeftColor:C.steel},
  summaryTitle:{fontSize:10,fontWeight:"800",color:C.info,textTransform:"uppercase",letterSpacing:1,marginBottom:4},
  summaryType:{fontSize:15,fontWeight:"800",color:C.navy},
  summaryMeta:{fontSize:12,color:C.textMute,marginTop:2},
  label:{fontSize:11,fontWeight:"800",color:C.navy,marginBottom:8,marginTop:14,textTransform:"uppercase",letterSpacing:0.8},
  input:{backgroundColor:C.surface,borderRadius:8,paddingHorizontal:14,paddingVertical:11,fontSize:13,color:C.navy,borderWidth:1.5,borderColor:C.border},
  textarea:{height:100,paddingTop:12},
  timeGrid:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:4},
  timeBtn:{paddingHorizontal:12,paddingVertical:8,borderRadius:8,backgroundColor:C.surface,borderWidth:1.5,borderColor:C.border},
  timeBtnActive:{backgroundColor:C.navy,borderColor:C.navy},
  timeBtnText:{fontSize:12,fontWeight:"700",color:C.textMute},
  timeBtnTextActive:{color:"#fff"},
  priorityGrid:{flexDirection:"row",gap:8,flexWrap:"wrap"},
  priorityBtn:{flex:1,minWidth:"45%",paddingVertical:10,borderRadius:8,alignItems:"center",borderWidth:1.5,borderColor:C.border,backgroundColor:C.surface},
  priorityText:{fontSize:12,fontWeight:"700",color:C.textMute},
  submitBtn:{backgroundColor:C.steel,borderRadius:10,paddingVertical:15,alignItems:"center",marginTop:22,elevation:4},
  submitText:{color:"#fff",fontSize:14,fontWeight:"800",letterSpacing:2},
  successBadge:{width:70,height:70,borderRadius:35,backgroundColor:C.navy,borderWidth:3,borderColor:C.gold,alignItems:"center",justifyContent:"center",marginBottom:16},
  successBadgeText:{fontSize:28,color:C.gold,fontWeight:"900"},
  successOrg:{fontSize:10,fontWeight:"900",color:C.textMute,letterSpacing:2,textTransform:"uppercase",marginBottom:6},
  successTitle:{fontSize:22,fontWeight:"900",color:C.navy,marginBottom:6},
  successSub:{fontSize:13,color:C.textMute,textAlign:"center",lineHeight:20,marginBottom:20},
  successCard:{width:"100%",backgroundColor:C.surface,borderRadius:12,padding:16,borderWidth:1,borderColor:C.border,marginBottom:20},
  successCardTitle:{fontSize:11,fontWeight:"800",color:C.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:12},
  dRow:{flexDirection:"row",justifyContent:"space-between",paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border},
  dLabel:{fontSize:12,color:C.textMute,fontWeight:"600"},
  dValue:{fontSize:13,color:C.navy,fontWeight:"700"},
  doneBtn:{width:"100%",backgroundColor:C.navy,borderRadius:10,paddingVertical:14,alignItems:"center",elevation:4},
  doneBtnText:{color:"#fff",fontSize:14,fontWeight:"800",letterSpacing:2},
});