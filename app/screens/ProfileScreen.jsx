import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";
const C = {
  navy:"#0B1F3A",steel:"#1E4D8C",gold:"#C9A84C",bg:"#F0F2F5",surface:"#FFFFFF",
  border:"#DDE3EC",textMute:"#8A9BB0",danger:"#9B1C1C",dangerBg:"#FEE8E8",
  success:"#1A7A4A",successBg:"#EAF6EF",steelLight:"#2E6BC4",
};
const ROLE_LABELS = {1:"Administrator",2:"Head / Director",3:"GSO Staff",4:"Requester"};

export default function ProfileScreen({ user, onBack, onUpdateUser }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");
  const [form, setForm] = useState({
    first_name:user?.first_name||"", last_name:user?.last_name||"",
    middle_initial:user?.middle_initial||"", email:user?.email||"",
    contact_number:user?.contact_number||"", department:user?.department||"",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSave = async () => {
    setError(""); setSuccess(false);
    if(!form.first_name.trim()){setError("First name required.");return;}
    if(!form.last_name.trim()){setError("Last name required.");return;}
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/profile`,{
        method:"PUT",
        headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify(form),
      });
      const data = await res.json();
      if(res.ok){
        const u={...user,...form};
        await AsyncStorage.setItem("user",JSON.stringify(u));
        onUpdateUser&&onUpdateUser(u);
        setSuccess(true); setEditing(false);
      } else setError(data.message||"Failed to update.");
    } catch(e){setError("Cannot connect to server.");}
    finally{setLoading(false);}
  };

  const initials=(user?.first_name?.[0]||"")+(user?.last_name?.[0]||"");
  const roleLabel=ROLE_LABELS[user?.role_id]||"User";

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":"height"}>
      <ScreenHeader title="My Profile" onBack={onBack}/>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.fullName}>{user?.first_name} {user?.last_name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{roleLabel}</Text>
          </View>
          <Text style={styles.username}>@{user?.username}</Text>
        </View>

        <View style={styles.body}>
          {error?<View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>:null}
          {success?<View style={styles.successBox}><Text style={styles.successText}>Profile updated!</Text></View>:null}

          {!editing?(
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Personal Information</Text>
                <TouchableOpacity style={styles.editBtn} onPress={()=>{setEditing(true);setSuccess(false);}}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <InfoRow label="First Name"     value={user?.first_name}/>
              <InfoRow label="Last Name"      value={user?.last_name}/>
              <InfoRow label="Middle Initial" value={user?.middle_initial}/>
              <InfoRow label="Email"          value={user?.email}/>
              <InfoRow label="Contact"        value={user?.contact_number}/>
              <InfoRow label="Department"     value={user?.department} last/>
            </View>
          ):(
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Edit Profile</Text>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput style={styles.input} value={form.first_name} onChangeText={v=>set("first_name",v)}/>
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput style={styles.input} value={form.last_name} onChangeText={v=>set("last_name",v)}/>
                </View>
              </View>
              <Text style={styles.label}>Middle Initial</Text>
              <TextInput style={styles.input} value={form.middle_initial} onChangeText={v=>set("middle_initial",v)} maxLength={2}/>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={form.email} onChangeText={v=>set("email",v)} keyboardType="email-address" autoCapitalize="none"/>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput style={styles.input} value={form.contact_number} onChangeText={v=>set("contact_number",v)} keyboardType="phone-pad"/>
              <Text style={styles.label}>Department / Office</Text>
              <TextInput style={styles.input} value={form.department} onChangeText={v=>set("department",v)}/>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={()=>setEditing(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn,loading&&{opacity:0.7}]} onPress={handleSave} disabled={loading}>
                  {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.saveText}>SAVE</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>
            <InfoRow label="Username" value={user?.username}/>
            <InfoRow label="Role"     value={roleLabel} last/>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({label,value,last}){
  return(
    <View style={[styles.infoRow,last&&{borderBottomWidth:0}]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value||"—"}</Text>
    </View>
  );
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:"#F0F2F5"},scroll:{paddingBottom:40},
  avatarSection:{backgroundColor:"#0B1F3A",alignItems:"center",paddingVertical:20,paddingBottom:28},
  avatar:{width:68,height:68,borderRadius:34,backgroundColor:"#1E4D8C",borderWidth:3,borderColor:"#C9A84C",alignItems:"center",justifyContent:"center",marginBottom:10},
  avatarText:{fontSize:24,fontWeight:"900",color:"#fff"},
  fullName:{color:"#fff",fontSize:18,fontWeight:"800"},
  rolePill:{backgroundColor:"rgba(255,255,255,0.12)",paddingHorizontal:12,paddingVertical:3,borderRadius:20,marginTop:6},
  rolePillText:{fontSize:11,color:"#C9A84C",fontWeight:"700",letterSpacing:1},
  username:{color:"#6A85A8",fontSize:13,marginTop:4},
  body:{padding:14},
  errorBox:{backgroundColor:"#FEE8E8",borderLeftWidth:4,borderLeftColor:"#9B1C1C",borderRadius:10,padding:12,marginBottom:10},
  errorText:{color:"#9B1C1C",fontSize:13,fontWeight:"600"},
  successBox:{backgroundColor:"#EAF6EF",borderLeftWidth:4,borderLeftColor:"#1A7A4A",borderRadius:10,padding:12,marginBottom:10},
  successText:{color:"#1A7A4A",fontSize:13,fontWeight:"600"},
  card:{backgroundColor:"#fff",borderRadius:12,padding:16,marginBottom:12,borderWidth:1,borderColor:"#DDE3EC",elevation:2},
  cardHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:12},
  cardTitle:{fontSize:11,fontWeight:"800",color:"#0B1F3A",textTransform:"uppercase",letterSpacing:1,marginBottom:12},
  editBtn:{paddingHorizontal:14,paddingVertical:6,backgroundColor:"#0B1F3A",borderRadius:8},
  editBtnText:{color:"#fff",fontSize:12,fontWeight:"700"},
  infoRow:{flexDirection:"row",justifyContent:"space-between",paddingVertical:10,borderBottomWidth:1,borderBottomColor:"#DDE3EC"},
  infoLabel:{fontSize:13,color:"#8A9BB0",fontWeight:"600"},
  infoValue:{fontSize:13,color:"#0B1F3A",fontWeight:"700",maxWidth:"60%",textAlign:"right"},
  row:{flexDirection:"row",gap:10},half:{flex:1},
  label:{fontSize:11,fontWeight:"800",color:"#0B1F3A",marginBottom:6,marginTop:12,textTransform:"uppercase",letterSpacing:0.8},
  input:{backgroundColor:"#F0F2F5",borderRadius:8,paddingHorizontal:14,paddingVertical:11,fontSize:13,color:"#0B1F3A",borderWidth:1.5,borderColor:"#DDE3EC"},
  btnRow:{flexDirection:"row",gap:10,marginTop:18},
  cancelBtn:{flex:1,borderRadius:10,paddingVertical:13,alignItems:"center",borderWidth:1.5,borderColor:"#DDE3EC"},
  cancelText:{fontSize:13,fontWeight:"700",color:"#8A9BB0"},
  saveBtn:{flex:2,backgroundColor:"#0B1F3A",borderRadius:10,paddingVertical:13,alignItems:"center",elevation:3},
  saveText:{color:"#fff",fontSize:13,fontWeight:"800",letterSpacing:1.5},
});