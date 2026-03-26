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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";
const C = {
  bg:"#F0F2F5",surface:"#FFFFFF",surfaceAlt:"#F7F9FC",navy:"#0B1F3A",
  navyMid:"#162C50",steel:"#1E4D8C",steelLight:"#2E6BC4",gold:"#C9A84C",
  text:"#0B1F3A",textMid:"#3D5068",textMute:"#8A9BB0",border:"#DDE3EC",
  success:"#1A7A4A",successBg:"#EAF6EF",warn:"#B45C10",warnBg:"#FEF3E2",
  danger:"#9B1C1C",dangerBg:"#FEE8E8",info:"#155E8A",infoBg:"#E6F2FA",
};
const ROLE_LABELS = {1:"Administrator",2:"Head / Director",3:"GSO Staff",4:"Requester"};
const ROLE_COLORS = {1:C.danger,2:C.steel,3:C.success,4:C.navyMid};

export default function DashboardScreen({ user, onLogout, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const roleId = user?.role_id;

  const fetchDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const headers = { Authorization:`Bearer ${token}`, Accept:"application/json" };
      let ep = "/requests";
      if (roleId===1) ep="/admin/requests";
      else if (roleId===2) ep="/head/requests";
      else if (roleId===3) ep="/staff/requests";
      const res = await fetch(`${API_URL}${ep}`,{headers,signal:AbortSignal.timeout(15000)});
      const data = await res.json();
      const reqs = Array.isArray(data)?data:data.data||[];
      setRecentRequests(reqs.slice(0,4));
      setStats({
        total:reqs.length,
        pending:reqs.filter(r=>r.status?.toLowerCase()==="pending").length,
        approved:reqs.filter(r=>r.status?.toLowerCase()==="approved").length,
        completed:reqs.filter(r=>r.status?.toLowerCase()==="completed").length,
      });
    } catch(e){setStats({total:0,pending:0,approved:0,completed:0});}
    finally{setLoading(false);setRefreshing(false);}
  };

  useEffect(()=>{fetchDashboard();},[]);
  const onRefresh=()=>{setRefreshing(true);fetchDashboard();};
  const handleLogout=async()=>{
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    onLogout&&onLogout();
  };

  const roleLabel = ROLE_LABELS[roleId]||"User";
  const roleColor = ROLE_COLORS[roleId]||C.navy;
  const today = new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  return (
    <View style={{flex:1,backgroundColor:C.navy}}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.steel}/>}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.goldBar}/>
          <View style={styles.headerInner}>
            <View style={styles.userRow}>
              <TouchableOpacity onPress={()=>onNavigate("Profile")} activeOpacity={0.8}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(user?.first_name?.[0]||"")+(user?.last_name?.[0]||"")}</Text>
                </View>
              </TouchableOpacity>
              <View style={{flex:1}}>
                <TouchableOpacity onPress={()=>onNavigate("Profile")} activeOpacity={0.8}>
                  <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
                </TouchableOpacity>
                <View style={[styles.rolePill,{backgroundColor:roleColor}]}>
                  <Text style={styles.rolePillText}>{roleLabel}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dateText}>{today}</Text>
          </View>
        </View>

        {loading?(
          <View style={styles.loadingBox}>
            <ActivityIndicator color={C.steel} size="large"/>
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ):(
          <>
            <View style={styles.section}>
              <SectionTitle title="Overview"/>
              <View style={styles.kpiGrid}>
                <KPI label="Total"    value={stats?.total}     color={C.steel}   bg={C.infoBg}/>
                <KPI label="Pending"  value={stats?.pending}   color={C.warn}    bg={C.warnBg}/>
                <KPI label="Approved" value={stats?.approved}  color={C.success} bg={C.successBg}/>
                <KPI label="Done"     value={stats?.completed} color={C.textMid} bg={C.surfaceAlt}/>
              </View>
            </View>

            <View style={styles.section}>
              <SectionTitle title="Quick Actions"/>
              <View style={styles.actionsGrid}>
                {getQuickActions(roleId,onNavigate).map((a,i)=>(
                  <TouchableOpacity key={i} style={styles.actionCard} onPress={a.onPress} activeOpacity={0.75}>
                    <Text style={styles.actionLabel}>{a.label}</Text>
                    <Text style={styles.actionArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.section,{marginBottom:32}]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent}/>
                <Text style={styles.sectionTitle}>Recent Requests</Text>
                <TouchableOpacity onPress={()=>onNavigate("ViewRequestStatus")} style={styles.viewAllBtn}>
                  <Text style={styles.viewAllText}>View All →</Text>
                </TouchableOpacity>
              </View>
              {recentRequests.length===0?(
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No requests yet.</Text></View>
              ):(
                <View style={styles.tableCard}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.thCell,{flex:2}]}>Type</Text>
                    <Text style={[styles.thCell,{flex:1.5}]}>Date</Text>
                    <Text style={[styles.thCell,{flex:1.2,textAlign:"right"}]}>Status</Text>
                  </View>
                  {recentRequests.map((req,i)=>{
                    const sm={
                      pending:{c:C.warn,bg:C.warnBg,l:"Pending"},
                      approved:{c:C.success,bg:C.successBg,l:"Approved"},
                      completed:{c:C.textMid,bg:C.surfaceAlt,l:"Done"},
                      disapproved:{c:C.danger,bg:C.dangerBg,l:"Denied"},
                    };
                    const s=sm[req.status?.toLowerCase()]||sm.pending;
                    return(
                      <TouchableOpacity key={i}
                        style={[styles.tableRow,i===recentRequests.length-1&&{borderBottomWidth:0}]}
                        onPress={()=>onNavigate("ViewRequestStatus",{requestId:req.id})}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.tdCell,{flex:2}]} numberOfLines={1}>{req.maintenance_type||req.type||"Request"}</Text>
                        <Text style={[styles.tdCell,{flex:1.5,color:C.textMute}]}>{req.created_at?.slice(0,10)||"—"}</Text>
                        <View style={[styles.chip,{backgroundColor:s.bg,flex:1.2,alignSelf:"center"}]}>
                          <Text style={[styles.chipText,{color:s.c}]}>{s.l}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({title}){
  return(
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent}/>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function KPI({label,value,color,bg}){
  return(
    <View style={[styles.kpiCard,{borderTopColor:color}]}>
      <Text style={[styles.kpiValue,{color}]}>{value??0}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function getQuickActions(roleId,onNavigate){
  const common=[
    {label:"My Profile",onPress:()=>onNavigate("Profile")},
    {label:"Notifications",onPress:()=>onNavigate("Notifications")},
  ];
  if(roleId===4) return [
    {label:"New Request",onPress:()=>onNavigate("SubmitRequest")},
    {label:"My Requests",onPress:()=>onNavigate("ViewRequestStatus")},
    {label:"Feedback",onPress:()=>onNavigate("Feedback")},
    ...common,
  ];
  if(roleId===1) return [
    {label:"All Requests",onPress:()=>onNavigate("ViewRequestStatus")},
    {label:"Review Requests",onPress:()=>onNavigate("ReviewRequests")},
    ...common,
  ];
  if(roleId===2) return [
    {label:"Review Requests",onPress:()=>onNavigate("ReviewRequests")},
    {label:"All Requests",onPress:()=>onNavigate("ViewRequestStatus")},
    ...common,
  ];
  if(roleId===3) return [
    {label:"Review Requests",onPress:()=>onNavigate("ReviewRequests")},
    {label:"Assign Schedule",onPress:()=>onNavigate("AssignSchedule")},
    {label:"All Requests",onPress:()=>onNavigate("ViewRequestStatus")},
    ...common,
  ];
  return common;
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},
  scroll:{paddingBottom:20},
  header:{backgroundColor:C.navy,paddingBottom:18},
  goldBar:{height:4,backgroundColor:C.gold},
  headerInner:{paddingHorizontal:16,paddingTop:12},
  userRow:{flexDirection:"row",alignItems:"center",gap:12},
  avatar:{width:46,height:46,borderRadius:23,backgroundColor:C.steelLight,alignItems:"center",justifyContent:"center",borderWidth:2,borderColor:C.gold},
  avatarText:{fontSize:15,fontWeight:"800",color:"#fff"},
  userName:{fontSize:15,fontWeight:"800",color:"#fff"},
  rolePill:{paddingHorizontal:8,paddingVertical:2,borderRadius:4,marginTop:4,alignSelf:"flex-start"},
  rolePillText:{fontSize:9,fontWeight:"700",color:"#fff",textTransform:"uppercase",letterSpacing:1},
  logoutBtn:{paddingHorizontal:10,paddingVertical:7,borderRadius:8,backgroundColor:"rgba(255,255,255,0.08)",borderWidth:1,borderColor:"rgba(255,255,255,0.12)"},
  logoutText:{fontSize:11,color:"#fff",fontWeight:"700"},
  dateText:{fontSize:10,color:"#6A85A8",marginTop:8},
  loadingBox:{alignItems:"center",paddingVertical:60},
  loadingText:{color:C.textMute,fontSize:14,marginTop:12},
  section:{marginHorizontal:16,marginTop:18},
  sectionHeader:{flexDirection:"row",alignItems:"center",marginBottom:10,gap:8},
  sectionAccent:{width:4,height:16,backgroundColor:C.gold,borderRadius:2},
  sectionTitle:{fontSize:12,fontWeight:"800",color:C.text,textTransform:"uppercase",letterSpacing:1.2,flex:1},
  viewAllBtn:{paddingHorizontal:10,paddingVertical:4,backgroundColor:C.infoBg,borderRadius:6},
  viewAllText:{fontSize:11,color:C.steel,fontWeight:"700"},
  kpiGrid:{flexDirection:"row",gap:8},
  kpiCard:{flex:1,backgroundColor:C.surface,borderRadius:12,padding:10,alignItems:"center",borderTopWidth:3,elevation:2},
  kpiValue:{fontSize:20,fontWeight:"900"},
  kpiLabel:{fontSize:9,color:C.textMute,fontWeight:"700",textTransform:"uppercase",letterSpacing:0.8,marginTop:2},
  actionsGrid:{gap:8},
  actionCard:{flexDirection:"row",alignItems:"center",backgroundColor:C.surface,borderRadius:12,paddingHorizontal:16,paddingVertical:13,borderWidth:1,borderColor:C.border,elevation:1},
  actionLabel:{flex:1,fontSize:14,fontWeight:"700",color:C.text},
  actionArrow:{fontSize:20,color:C.textMute},
  tableCard:{backgroundColor:C.surface,borderRadius:12,overflow:"hidden",borderWidth:1,borderColor:C.border,elevation:2},
  tableHeader:{flexDirection:"row",backgroundColor:C.surfaceAlt,paddingHorizontal:14,paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border},
  thCell:{fontSize:10,fontWeight:"800",color:C.textMute,textTransform:"uppercase",letterSpacing:0.8},
  tableRow:{flexDirection:"row",alignItems:"center",paddingHorizontal:14,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.border},
  tdCell:{fontSize:13,color:C.text,fontWeight:"600"},
  chip:{paddingHorizontal:6,paddingVertical:3,borderRadius:4,alignItems:"center"},
  chipText:{fontSize:9,fontWeight:"800",textTransform:"uppercase"},
  emptyCard:{backgroundColor:C.surface,borderRadius:12,padding:30,alignItems:"center",borderWidth:1,borderColor:C.border},
  emptyText:{fontSize:14,color:C.textMute,fontWeight:"600"},
});