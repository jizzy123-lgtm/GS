import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";
const C = {
  navy:"#0B1F3A",steel:"#1E4D8C",gold:"#C9A84C",bg:"#F0F2F5",surface:"#FFFFFF",
  border:"#DDE3EC",textMute:"#8A9BB0",success:"#1A7A4A",successBg:"#EAF6EF",
  warn:"#B45C10",warnBg:"#FEF3E2",danger:"#9B1C1C",dangerBg:"#FEE8E8",
  info:"#155E8A",infoBg:"#E6F2FA",
};
const ICONS = {approved:"✅",disapproved:"❌",completed:"🎉",pending:"⏳",feedback:"💬",schedule:"📅",default:"🔔"};

export default function NotificationsScreen({ onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetch_ = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/notifications`,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
      const data = await res.json();
      setNotifications(Array.isArray(data)?data:data.data||[]);
    } catch(e){setNotifications([]);}
    finally{setLoading(false);setRefreshing(false);}
  };

  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${API_URL}/notifications/read-all`,{method:"POST",headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
      setNotifications(prev=>prev.map(n=>({...n,read_at:new Date().toISOString()})));
    } catch(e){}
  };

  const markRead = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${API_URL}/notifications/${id}/read`,{method:"POST",headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
      setNotifications(prev=>prev.map(n=>n.id===id?{...n,read_at:new Date().toISOString()}:n));
    } catch(e){}
  };

  const handleTap = (n) => { setSelected(n); if(!n.read_at) markRead(n.id); };

  useEffect(()=>{fetch_();},[]);
  const onRefresh=()=>{setRefreshing(true);fetch_();};
  const unread = notifications.filter(n=>!n.read_at).length;

  const getIcon = (n) => {
    const t = n.type?.toLowerCase()||n.data?.type?.toLowerCase()||"";
    for(const k of Object.keys(ICONS)) if(t.includes(k)) return ICONS[k];
    return ICONS.default;
  };

  const getColor = (n) => {
    const t = n?.type?.toLowerCase()||n?.data?.type?.toLowerCase()||"";
    if(t.includes("approved"))    return {color:C.success,bg:C.successBg};
    if(t.includes("disapproved")) return {color:C.danger,bg:C.dangerBg};
    if(t.includes("completed"))   return {color:C.success,bg:C.successBg};
    if(t.includes("schedule"))    return {color:C.info,bg:C.infoBg};
    if(t.includes("pending"))     return {color:C.warn,bg:C.warnBg};
    return {color:C.navy,bg:C.border};
  };

  return (
    <>
      <ScreenHeader
        title="Notifications"
        subtitle={unread>0?`${unread} unread`:undefined}
        onBack={onBack}
        rightAction={unread>0?{label:"Mark all read",onPress:markAllRead}:undefined}
      />
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy}/>}>
        <View style={styles.body}>
          {loading?(
            <ActivityIndicator color={C.navy} style={{marginTop:40}}/>
          ):notifications.length===0?(
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔕</Text>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>You're all caught up!</Text>
            </View>
          ):notifications.map((n,i)=>(
            <TouchableOpacity key={n.id||i} style={[styles.card,!n.read_at&&styles.cardUnread]} onPress={()=>handleTap(n)} activeOpacity={0.8}>
              <View style={[styles.iconBox,!n.read_at&&styles.iconBoxUnread]}>
                <Text style={styles.icon}>{getIcon(n)}</Text>
              </View>
              <View style={{flex:1}}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle,!n.read_at&&{color:C.navy,fontWeight:"800"}]} numberOfLines={1}>
                    {n.data?.title||n.title||"Notification"}
                  </Text>
                  {!n.read_at&&<View style={styles.dot}/>}
                </View>
                <Text style={styles.cardMsg} numberOfLines={2}>{n.data?.message||n.message||n.body||"New notification."}</Text>
                <Text style={styles.cardTime}>{n.created_at?.slice(0,16).replace("T"," ")||""}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={()=>setSelected(null)}>
        <TouchableWithoutFeedback onPress={()=>setSelected(null)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modal}>
                <View style={[styles.modalBar,{backgroundColor:selected?getColor(selected).color:C.navy}]}/>
                <View style={[styles.modalIconBox,{backgroundColor:selected?getColor(selected).bg:C.border}]}>
                  <Text style={styles.modalIcon}>{selected?getIcon(selected):"🔔"}</Text>
                </View>
                <Text style={styles.modalTitle}>{selected?.data?.title||selected?.title||"Notification"}</Text>
                <Text style={styles.modalTime}>{selected?.created_at?.slice(0,16).replace("T"," ")||""}</Text>
                <View style={styles.modalDivider}/>
                <Text style={styles.modalMsg}>{selected?.data?.message||selected?.message||selected?.body||"You have a new notification."}</Text>
                {selected?.data?.request_id&&(
                  <View style={[styles.modalInfo,{backgroundColor:selected?getColor(selected).bg:C.border}]}>
                    <Text style={[styles.modalInfoText,{color:selected?getColor(selected).color:C.navy}]}>Request #{selected.data.request_id}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.modalClose} onPress={()=>setSelected(null)} activeOpacity={0.85}>
                  <Text style={styles.modalCloseText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#F0F2F5"},scroll:{paddingBottom:40},
  body:{padding:14},
  card:{flexDirection:"row",alignItems:"flex-start",backgroundColor:"#fff",borderRadius:12,padding:14,marginBottom:8,gap:10,borderWidth:1,borderColor:"#DDE3EC",elevation:1},
  cardUnread:{borderLeftWidth:4,borderLeftColor:"#0B1F3A",backgroundColor:"#F0F4FF"},
  iconBox:{width:42,height:42,borderRadius:21,backgroundColor:"#F0F2F5",alignItems:"center",justifyContent:"center"},
  iconBoxUnread:{backgroundColor:"#E0E8FF"},
  icon:{fontSize:18},
  cardTop:{flexDirection:"row",alignItems:"center",gap:6},
  cardTitle:{fontSize:14,fontWeight:"700",color:"#8A9BB0",flex:1},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:"#0B1F3A"},
  cardMsg:{fontSize:13,color:"#64748b",marginTop:2,lineHeight:18},
  cardTime:{fontSize:11,color:"#8A9BB0",marginTop:4},
  emptyCard:{alignItems:"center",paddingVertical:80},
  emptyIcon:{fontSize:48,marginBottom:12},
  emptyTitle:{fontSize:18,fontWeight:"800",color:"#0B1F3A",marginBottom:6},
  emptyText:{fontSize:14,color:"#8A9BB0",textAlign:"center"},
  overlay:{flex:1,backgroundColor:"rgba(0,0,0,0.5)",justifyContent:"center",alignItems:"center",padding:20},
  modal:{backgroundColor:"#fff",borderRadius:20,width:"100%",overflow:"hidden",alignItems:"center",elevation:20},
  modalBar:{height:5,width:"100%",marginBottom:20},
  modalIconBox:{width:60,height:60,borderRadius:30,alignItems:"center",justifyContent:"center",marginBottom:12},
  modalIcon:{fontSize:26},
  modalTitle:{fontSize:17,fontWeight:"900",color:"#0B1F3A",textAlign:"center",paddingHorizontal:20},
  modalTime:{fontSize:11,color:"#8A9BB0",marginTop:4,marginBottom:12},
  modalDivider:{height:1,backgroundColor:"#DDE3EC",width:"100%",marginBottom:14},
  modalMsg:{fontSize:14,color:"#3D5068",lineHeight:22,textAlign:"center",paddingHorizontal:20,marginBottom:14},
  modalInfo:{paddingHorizontal:14,paddingVertical:7,borderRadius:8,marginBottom:14},
  modalInfoText:{fontSize:13,fontWeight:"700"},
  modalClose:{width:"100%",backgroundColor:"#0B1F3A",paddingVertical:15,alignItems:"center"},
  modalCloseText:{color:"#fff",fontSize:14,fontWeight:"800",letterSpacing:2},
});