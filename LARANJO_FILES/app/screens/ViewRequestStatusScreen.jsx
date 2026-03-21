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
const C = {
  navy:"#0B1F3A",steel:"#1E4D8C",gold:"#C9A84C",bg:"#F0F2F5",surface:"#FFFFFF",
  surfaceAlt:"#F7F9FC",border:"#DDE3EC",textMute:"#8A9BB0",
  success:"#1A7A4A",successBg:"#EAF6EF",warn:"#B45C10",warnBg:"#FEF3E2",
  danger:"#9B1C1C",dangerBg:"#FEE8E8",info:"#155E8A",infoBg:"#E6F2FA",
};
const STATUS={
  pending:  {color:"#f59e0b",bg:"#fffbeb",label:"Pending",icon:"⏳"},
  approved: {color:"#10b981",bg:"#f0fdf4",label:"Approved",icon:"✅"},
  disapproved:{color:"#ef4444",bg:"#fff0f0",label:"Disapproved",icon:"❌"},
  completed:{color:"#3b82f6",bg:"#eff6ff",label:"Completed",icon:"🎉"},
  in_progress:{color:"#8b5cf6",bg:"#f5f3ff",label:"In Progress",icon:"🔧"},
};
const FILTERS=["All","Pending","Approved","Completed","Disapproved"];

export default function ViewRequestStatusScreen({ onBack, onNavigate, user }) {
  const [requests,setRequests]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [activeFilter,setActiveFilter]=useState("All");
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [selected,setSelected]=useState(null);

  const fetchRequests=async()=>{
    try{
      const token=await AsyncStorage.getItem("token");
      const roleId=user?.role_id;
      let ep="/requests";
      if(roleId===1)ep="/admin/requests";
      else if(roleId===2)ep="/head/requests";
      else if(roleId===3)ep="/staff/requests";
      const res=await fetch(`${API_URL}${ep}`,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
      const data=await res.json();
      const list=Array.isArray(data)?data:data.data||[];
      setRequests(list);setFiltered(list);
    }catch(e){setRequests([]);}
    finally{setLoading(false);setRefreshing(false);}
  };

  useEffect(()=>{fetchRequests();},[]);
  useEffect(()=>{
    setFiltered(activeFilter==="All"?requests:requests.filter(r=>r.status?.toLowerCase()===activeFilter.toLowerCase()));
  },[activeFilter,requests]);
  const onRefresh=()=>{setRefreshing(true);fetchRequests();};

  if(selected) return(
    <RequestDetail
      request={selected}
      onBack={()=>setSelected(null)}
      user={user}
      onFeedback={()=>onNavigate("Feedback",{requestId:selected.id})}
    />
  );

  return(
    <View style={{flex:1,backgroundColor:C.bg}}>
      <ScreenHeader title="Requests" subtitle={`${filtered.length} found`} onBack={onBack}/>
      <ScrollView contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy}/>}>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{paddingHorizontal:14,gap:8}}>
          {FILTERS.map(f=>(
            <TouchableOpacity key={f} style={[styles.filterBtn,activeFilter===f&&styles.filterBtnActive]} onPress={()=>setActiveFilter(f)}>
              <Text style={[styles.filterText,activeFilter===f&&styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.body}>
          {loading?<ActivityIndicator color={C.navy} style={{marginTop:40}}/>
          :filtered.length===0?<View style={styles.empty}><Text style={styles.emptyIcon}>📭</Text><Text style={styles.emptyText}>No requests found.</Text></View>
          :filtered.map((req,i)=>{
            const st=req.status?.toLowerCase()||"pending";
            const s=STATUS[st]||STATUS.pending;
            return(
              <TouchableOpacity key={i} style={[styles.card,{borderLeftColor:s.color}]} onPress={()=>setSelected(req)} activeOpacity={0.8}>
                <View style={styles.cardTop}>
                  <View style={[styles.badge,{backgroundColor:s.bg}]}>
                    <Text style={[styles.badgeText,{color:s.color}]}>{s.icon} {s.label}</Text>
                  </View>
                  <Text style={styles.cardDate}>{req.created_at?.slice(0,10)}</Text>
                </View>
                <Text style={styles.cardType}>{req.maintenance_type||req.type||"Request"}</Text>
                <Text style={styles.cardLocation} numberOfLines={1}>📍 {req.location||"—"}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{req.description||"No description."}</Text>
                <Text style={styles.viewMore}>View Details →</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function RequestDetail({request,onBack,user,onFeedback}){
  const st=request.status?.toLowerCase()||"pending";
  const s=STATUS[st]||STATUS.pending;
  const isCompleted=st==="completed";
  const isRequester=user?.role_id===4;
  return(
    <View style={{flex:1,backgroundColor:"#F0F2F5"}}>
      <ScreenHeader title="Request Details" onBack={onBack} backLabel="← Back to List"/>
      <ScrollView contentContainerStyle={{paddingBottom:40}}>
        <View style={{padding:14}}>
          <View style={[styles.statusBanner,{backgroundColor:s.bg,borderColor:s.color}]}>
            <Text style={[styles.statusBannerText,{color:s.color}]}>{s.icon}  {s.label}</Text>
          </View>
          {[
            {l:"Request ID",v:`#${request.id}`},
            {l:"Maintenance Type",v:request.maintenance_type||request.type},
            {l:"Priority",v:request.priority},
            {l:"Location",v:request.location},
            {l:"Description",v:request.description},
            {l:"Submitted",v:request.created_at?.slice(0,10)},
          ].map((row,i)=>(
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{row.l}</Text>
              <Text style={styles.detailValue}>{row.v||"—"}</Text>
            </View>
          ))}
          {request.remarks&&(
            <View style={[styles.detailRow,{backgroundColor:"#fffbeb"}]}>
              <Text style={styles.detailLabel}>Remarks</Text>
              <Text style={[styles.detailValue,{color:"#92400e",fontWeight:"700"}]}>{request.remarks}</Text>
            </View>
          )}
          {isCompleted&&isRequester&&(
            <TouchableOpacity style={styles.feedbackBtn} onPress={onFeedback} activeOpacity={0.85}>
              <Text style={styles.feedbackBtnText}>💬 Leave Feedback</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles=StyleSheet.create({
  scroll:{paddingBottom:40},
  filterRow:{marginTop:12,marginBottom:4},
  filterBtn:{paddingHorizontal:14,paddingVertical:7,borderRadius:20,backgroundColor:"#fff",borderWidth:1.5,borderColor:"#DDE3EC"},
  filterBtnActive:{backgroundColor:"#0B1F3A",borderColor:"#0B1F3A"},
  filterText:{fontSize:12,fontWeight:"600",color:"#64748b"},
  filterTextActive:{color:"#fff"},
  body:{padding:14},
  card:{backgroundColor:"#fff",borderRadius:14,padding:14,marginBottom:10,borderLeftWidth:4,elevation:2},
  cardTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:6},
  badge:{paddingHorizontal:10,paddingVertical:4,borderRadius:20},
  badgeText:{fontSize:11,fontWeight:"700"},
  cardDate:{fontSize:11,color:"#94a3b8"},
  cardType:{fontSize:15,fontWeight:"800",color:"#0B1F3A",marginBottom:3},
  cardLocation:{fontSize:12,color:"#64748b",marginBottom:3},
  cardDesc:{fontSize:13,color:"#475569",lineHeight:18},
  viewMore:{fontSize:12,color:"#1E4D8C",fontWeight:"700",marginTop:6,textAlign:"right"},
  empty:{alignItems:"center",paddingVertical:60},
  emptyIcon:{fontSize:44,marginBottom:10},
  emptyText:{fontSize:15,color:"#94a3b8",fontWeight:"600"},
  statusBanner:{borderWidth:1.5,borderRadius:12,padding:14,alignItems:"center",marginBottom:14},
  statusBannerText:{fontSize:17,fontWeight:"800"},
  detailRow:{backgroundColor:"#fff",borderRadius:10,padding:14,marginBottom:8,elevation:1},
  detailLabel:{fontSize:11,fontWeight:"700",color:"#94a3b8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:3},
  detailValue:{fontSize:14,color:"#0B1F3A",fontWeight:"600"},
  feedbackBtn:{backgroundColor:"#1a5c72",borderRadius:14,paddingVertical:14,alignItems:"center",marginTop:14,elevation:4},
  feedbackBtnText:{color:"#fff",fontSize:15,fontWeight:"800"},
});