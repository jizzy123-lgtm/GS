import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";
const C={navy:"#0B1F3A",steel:"#1E4D8C",gold:"#C9A84C",bg:"#F0F2F5",surface:"#FFFFFF",surfaceAlt:"#F7F9FC",border:"#DDE3EC",textMute:"#8A9BB0",danger:"#9B1C1C",dangerBg:"#FEE8E8",success:"#1A7A4A",successBg:"#EAF6EF",warn:"#B45C10",warnBg:"#FEF3E2",info:"#155E8A",infoBg:"#E6F2FA"};
const SM={pending:{color:C.warn,bg:C.warnBg,label:"Pending"},approved:{color:C.success,bg:C.successBg,label:"Approved"},confirmed:{color:C.info,bg:C.infoBg,label:"Confirmed"},completed:{color:C.navy,bg:C.surfaceAlt,label:"Completed"},disapproved:{color:C.danger,bg:C.dangerBg,label:"Disapproved"}};
const FILTERS=["All","Pending","Approved","Confirmed","Completed","Disapproved"];

export default function ReviewRequestsScreen({ user, onBack, onNavigate }) {
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [filter,setFilter]=useState("All");
  const [selected,setSelected]=useState(null);
  const [actionLoading,setActionLoading]=useState(false);
  const [actionMsg,setActionMsg]=useState("");
  const roleId=user?.role_id;

  const fetchRequests=async()=>{
    try{
      const token=await AsyncStorage.getItem("token");
      const ep=roleId===2?"/head/requests":"/staff/requests";
      const res=await fetch(`${API_URL}${ep}`,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"},signal:AbortSignal.timeout(15000)});
      const data=await res.json();
      setRequests(Array.isArray(data)?data:data.data||[]);
    }catch(e){setRequests([]);}
    finally{setLoading(false);setRefreshing(false);}
  };

  useEffect(()=>{fetchRequests();},[]);
  const onRefresh=()=>{setRefreshing(true);fetchRequests();};
  const filtered=filter==="All"?requests:requests.filter(r=>r.status?.toLowerCase()===filter.toLowerCase());

  const doAction=async(id,action)=>{
    setActionLoading(true);setActionMsg("");
    try{
      const token=await AsyncStorage.getItem("token");
      const res=await fetch(`${API_URL}/requests/${id}/${action}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
      if(res.ok){setActionMsg(`Request ${action}d successfully.`);fetchRequests();setSelected(null);}
      else{const d=await res.json();setActionMsg(d.message||`Failed to ${action}.`);}
    }catch(e){setActionMsg("Cannot connect to server.");}
    finally{setActionLoading(false);}
  };

  if(selected){
    const s=SM[selected.status?.toLowerCase()]||SM.pending;
    const isConfirmed=["confirmed","approved"].includes(selected.status?.toLowerCase());
    const canApprove=roleId===2&&selected.status?.toLowerCase()==="pending";
    const canAssign=roleId===3&&isConfirmed;
    return(
      <View style={{flex:1,backgroundColor:C.bg}}>
        <ScreenHeader title="Request Details" onBack={()=>{setSelected(null);setActionMsg("");}} backLabel="← Back to List"/>
        <ScrollView contentContainerStyle={{padding:14,paddingBottom:40}}>
          {actionMsg?(
            <View style={[styles.msgBox,{borderLeftColor:actionMsg.includes("success")?C.success:C.danger,backgroundColor:actionMsg.includes("success")?C.successBg:C.dangerBg}]}>
              <Text style={[styles.msgText,{color:actionMsg.includes("success")?C.success:C.danger}]}>{actionMsg}</Text>
            </View>
          ):null}
          <View style={[styles.statusBanner,{backgroundColor:s.bg,borderLeftColor:s.color}]}>
            <Text style={[styles.statusBannerText,{color:s.color}]}>{s.label}</Text>
          </View>
          <View style={styles.detailCard}>
            {[["Request ID",`#${selected.id}`],["Type",selected.maintenance_type||selected.type],["Priority",selected.priority],["Location",selected.location],["Submitted by",selected.requester_name||selected.user?.name],["Date",selected.created_at?.slice(0,10)],["Description",selected.description]].map(([l,v],i,arr)=>(
              <View key={i} style={[styles.dRow,i===arr.length-1&&{borderBottomWidth:0}]}>
                <Text style={styles.dLabel}>{l}</Text>
                <Text style={styles.dValue}>{v||"—"}</Text>
              </View>
            ))}
          </View>
          {selected.scheduled_date&&(
            <View style={styles.schedCard}>
              <Text style={styles.schedTitle}>Assigned Schedule</Text>
              {[["Date",selected.scheduled_date],["Time",selected.scheduled_time],["Staff",selected.assigned_staff]].map(([l,v],i,arr)=>(
                <View key={i} style={[styles.dRow,i===arr.length-1&&{borderBottomWidth:0}]}>
                  <Text style={styles.dLabel}>{l}</Text>
                  <Text style={styles.dValue}>{v||"—"}</Text>
                </View>
              ))}
            </View>
          )}
          {canApprove&&(
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.approveBtn,actionLoading&&{opacity:0.6}]} onPress={()=>doAction(selected.id,"approve")} disabled={actionLoading}>
                {actionLoading?<ActivityIndicator color="#fff"/>:<Text style={styles.approveBtnText}>APPROVE</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.disapproveBtn,actionLoading&&{opacity:0.6}]} onPress={()=>doAction(selected.id,"disapprove")} disabled={actionLoading}>
                <Text style={styles.disapproveBtnText}>DISAPPROVE</Text>
              </TouchableOpacity>
            </View>
          )}
          {canAssign&&(
            <TouchableOpacity style={styles.assignBtn} onPress={()=>onNavigate("AssignSchedule",{requestId:selected.id,request:selected})} activeOpacity={0.85}>
              <Text style={styles.assignBtnText}>ASSIGN SCHEDULE</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  return(
    <View style={{flex:1,backgroundColor:C.bg}}>
      <ScreenHeader
        title="Review Requests"
        subtitle={roleId===2?"Approve or disapprove requests":"View confirmed & assign schedules"}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={{paddingBottom:40}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.steel}/>}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:12}} contentContainerStyle={{paddingHorizontal:14,gap:8}}>
          {FILTERS.map(f=>(
            <TouchableOpacity key={f} style={[styles.filterTab,filter===f&&styles.filterTabActive]} onPress={()=>setFilter(f)}>
              <Text style={[styles.filterTabText,filter===f&&styles.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{padding:14}}>
          {loading?<ActivityIndicator color={C.steel} style={{marginTop:40}}/>
          :filtered.length===0?<View style={styles.emptyCard}><Text style={styles.emptyText}>No {filter!=="All"?filter.toLowerCase():""} requests.</Text></View>
          :filtered.map((req,i)=>{
            const s=SM[req.status?.toLowerCase()]||SM.pending;
            const isConfirmed=["confirmed","approved"].includes(req.status?.toLowerCase());
            return(
              <TouchableOpacity key={i} style={[styles.reqCard,{borderLeftColor:s.color}]} onPress={()=>setSelected(req)} activeOpacity={0.8}>
                <View style={styles.reqCardTop}>
                  <Text style={styles.reqType} numberOfLines={1}>{req.maintenance_type||req.type||"Request"}</Text>
                  <View style={[styles.chip,{backgroundColor:s.bg}]}>
                    <Text style={[styles.chipText,{color:s.color}]}>{s.label}</Text>
                  </View>
                </View>
                <Text style={styles.reqMeta}>{req.location||"—"}  ·  {req.created_at?.slice(0,10)||"—"}</Text>
                {roleId===3&&isConfirmed&&!req.scheduled_date&&(
                  <View style={styles.assignTag}><Text style={styles.assignTagText}>Needs Schedule</Text></View>
                )}
                {req.scheduled_date&&<Text style={styles.scheduledText}>📅 Scheduled: {req.scheduled_date}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles=StyleSheet.create({
  filterTab:{paddingHorizontal:14,paddingVertical:7,borderRadius:20,backgroundColor:C.surface,borderWidth:1.5,borderColor:C.border},
  filterTabActive:{backgroundColor:C.navy,borderColor:C.navy},
  filterTabText:{fontSize:12,fontWeight:"700",color:C.textMute},
  filterTabTextActive:{color:"#fff"},
  emptyCard:{backgroundColor:C.surface,borderRadius:12,padding:36,alignItems:"center",borderWidth:1,borderColor:C.border},
  emptyText:{fontSize:14,color:C.textMute,fontWeight:"600"},
  reqCard:{backgroundColor:C.surface,borderRadius:12,padding:14,marginBottom:10,borderLeftWidth:4,borderWidth:1,borderColor:C.border,elevation:1},
  reqCardTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:4},
  reqType:{fontSize:15,fontWeight:"700",color:C.navy,flex:1},
  reqMeta:{fontSize:12,color:C.textMute,marginTop:2},
  chip:{paddingHorizontal:10,paddingVertical:3,borderRadius:4},
  chipText:{fontSize:10,fontWeight:"800",textTransform:"uppercase"},
  assignTag:{marginTop:8,backgroundColor:C.infoBg,borderRadius:6,paddingHorizontal:10,paddingVertical:4,alignSelf:"flex-start"},
  assignTagText:{fontSize:11,color:C.info,fontWeight:"700"},
  scheduledText:{fontSize:11,color:C.success,fontWeight:"600",marginTop:6},
  msgBox:{borderLeftWidth:4,borderRadius:10,padding:12,marginBottom:12},
  msgText:{fontSize:13,fontWeight:"600"},
  statusBanner:{borderLeftWidth:4,borderRadius:8,padding:14,marginBottom:12},
  statusBannerText:{fontSize:16,fontWeight:"800",textTransform:"uppercase",letterSpacing:1},
  detailCard:{backgroundColor:C.surface,borderRadius:12,padding:16,marginBottom:12,borderWidth:1,borderColor:C.border,elevation:2},
  dRow:{flexDirection:"row",justifyContent:"space-between",paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.border},
  dLabel:{fontSize:12,color:C.textMute,fontWeight:"600",flex:1},
  dValue:{fontSize:13,color:C.navy,fontWeight:"700",flex:2,textAlign:"right"},
  schedCard:{backgroundColor:C.successBg,borderRadius:12,padding:16,marginBottom:12,borderWidth:1,borderColor:C.success},
  schedTitle:{fontSize:11,fontWeight:"800",color:C.success,textTransform:"uppercase",letterSpacing:1,marginBottom:10},
  actionRow:{flexDirection:"row",gap:10,marginTop:6,marginBottom:10},
  approveBtn:{flex:1,backgroundColor:C.success,borderRadius:10,paddingVertical:14,alignItems:"center",elevation:3},
  approveBtnText:{color:"#fff",fontSize:13,fontWeight:"800",letterSpacing:1.5},
  disapproveBtn:{flex:1,borderRadius:10,paddingVertical:14,alignItems:"center",borderWidth:1.5,borderColor:C.danger},
  disapproveBtnText:{color:C.danger,fontSize:13,fontWeight:"800",letterSpacing:1.5},
  assignBtn:{backgroundColor:C.steel,borderRadius:10,paddingVertical:15,alignItems:"center",elevation:4,marginTop:6},
  assignBtnText:{color:"#fff",fontSize:14,fontWeight:"800",letterSpacing:2},
});