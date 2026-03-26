import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView, Platform,
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
  success:"#1A7A4A",warn:"#B45C10",warnBg:"#FEF3E2",
};
const TYPES=[
  {key:"janitorial",label:"Janitorial",color:"#1A7A4A"},
  {key:"carpentry",label:"Carpentry",color:"#B45C10"},
  {key:"electrical",label:"Electrical",color:"#1E4D8C"},
  {key:"air_conditioning",label:"Air Conditioning",color:"#0E6E8C"},
];
const PRIORITIES=[
  {key:"low",label:"Low",color:"#1A7A4A"},
  {key:"medium",label:"Medium",color:"#B45C10"},
  {key:"high",label:"High",color:"#9B1C1C"},
];

function Toast({visible,message}){
  const op=useRef(new Animated.Value(0)).current;
  const ty=useRef(new Animated.Value(-20)).current;
  useEffect(()=>{
    Animated.parallel([
      Animated.timing(op,{toValue:visible?1:0,duration:visible?300:250,useNativeDriver:true}),
      Animated.timing(ty,{toValue:visible?0:-20,duration:visible?300:250,useNativeDriver:true}),
    ]).start();
  },[visible]);
  return(
    <Animated.View style={[styles.toast,{opacity:op,transform:[{translateY:ty}]}]}>
      <View style={styles.toastDot}/>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

function WaitingScreen({submittedType,onNewRequest,onGoHome}){
  return(
    <View style={{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center",padding:24}}>
      <View style={styles.waitBadge}>
        <Text style={styles.waitBadgeText}>✓</Text>
      </View>
      <Text style={styles.waitOrg}>GSU GATEWAY</Text>
      <Text style={styles.waitTitle}>Request Submitted!</Text>
      <Text style={styles.waitSub}>Your <Text style={{color:C.steel,fontWeight:"800"}}>{submittedType}</Text> request has been received.</Text>
      <View style={styles.waitCard}>
        <Text style={styles.waitCardTitle}>What happens next?</Text>
        {["Head/Director reviews your request","Request gets approved or disapproved","Service is scheduled and completed","You provide feedback on the service"].map((s,i)=>(
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepNum,i===0&&styles.stepNumActive]}>
              <Text style={[styles.stepNumText,i===0&&styles.stepNumTextActive]}>{i+1}</Text>
            </View>
            <Text style={[styles.stepLabel,i===0&&styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.newBtn} onPress={onNewRequest} activeOpacity={0.85}>
        <Text style={styles.newBtnText}>SUBMIT ANOTHER</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.85}>
        <Text style={styles.homeBtnText}>BACK TO HOME</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SubmitRequestScreen({ onBack, onSuccess }) {
  const [type,setType]=useState("");
  const [priority,setPriority]=useState("medium");
  const [location,setLocation]=useState("");
  const [description,setDescription]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [showToast,setShowToast]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [submittedType,setSubmittedType]=useState("");

  const handleSubmit=async()=>{
    setError("");
    if(!type){setError("Please select a maintenance type.");return;}
    if(!location.trim()){setError("Please enter the location.");return;}
    if(!description.trim()){setError("Please describe the issue.");return;}
    setLoading(true);
    try{
      const token=await AsyncStorage.getItem("token");
      const res=await fetch(`${API_URL}/requests`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({maintenance_type:type,priority,location,description}),
      });
      const data=await res.json();
      if(res.ok){
        setSubmittedType(TYPES.find(t=>t.key===type)?.label||type);
        setShowToast(true);
        setTimeout(()=>{setShowToast(false);setSubmitted(true);},1800);
      } else setError(data.message||"Failed to submit.");
    }catch(e){setError("Cannot connect to server.");}
    finally{setLoading(false);}
  };

  const handleNew=()=>{setType("");setPriority("medium");setLocation("");setDescription("");setError("");setSubmitted(false);setSubmittedType("");};

  if(submitted) return <WaitingScreen submittedType={submittedType} onNewRequest={handleNew} onGoHome={onSuccess}/>;

  return(
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":"height"}>
      <Toast visible={showToast} message="Request submitted successfully!"/>
      <ScreenHeader title="New Request" subtitle="Submit a maintenance service request" onBack={onBack}/>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          {error?<View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>:null}

          <Text style={styles.label}>Maintenance Type *</Text>
          <View style={styles.typeGrid}>
            {TYPES.map(t=>(
              <TouchableOpacity key={t.key} style={[styles.typeCard,type===t.key&&{borderColor:t.color,backgroundColor:t.color+"12"}]}
                onPress={()=>setType(t.key)} activeOpacity={0.8}>
                <Text style={[styles.typeLabel,type===t.key&&{color:t.color}]}>{t.label}</Text>
                {type===t.key&&<View style={[styles.typeCheck,{backgroundColor:t.color}]}><Text style={{color:"#fff",fontSize:9,fontWeight:"900"}}>OK</Text></View>}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Priority *</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p=>(
              <TouchableOpacity key={p.key} style={[styles.priorityBtn,priority===p.key&&{backgroundColor:p.color,borderColor:p.color}]}
                onPress={()=>setPriority(p.key)} activeOpacity={0.8}>
                <Text style={[styles.priorityText,priority===p.key&&{color:"#fff"}]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Location / Room *</Text>
          <TextInput style={styles.input} placeholder="e.g. Room 204, Admin Building" placeholderTextColor="#a0aec0" value={location} onChangeText={setLocation}/>

          <Text style={styles.label}>Issue Description *</Text>
          <TextInput style={[styles.input,styles.textarea]} placeholder="Describe the issue..." placeholderTextColor="#a0aec0" value={description} onChangeText={setDescription} multiline numberOfLines={5} textAlignVertical="top"/>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>Your request will be reviewed by the Head / Campus Director before processing.</Text>
          </View>

          <TouchableOpacity style={[styles.submitBtn,loading&&{opacity:0.7}]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.submitText}>SUBMIT REQUEST</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},scroll:{paddingBottom:40},
  body:{padding:18},
  toast:{position:"absolute",top:16,alignSelf:"center",zIndex:999,flexDirection:"row",alignItems:"center",gap:10,backgroundColor:C.navy,paddingHorizontal:20,paddingVertical:12,borderRadius:10,borderLeftWidth:4,borderLeftColor:C.gold,elevation:10},
  toastDot:{width:8,height:8,borderRadius:4,backgroundColor:C.gold},
  toastText:{color:"#fff",fontSize:13,fontWeight:"700"},
  errorBox:{backgroundColor:C.dangerBg,borderLeftWidth:4,borderLeftColor:C.danger,borderRadius:10,padding:12,marginBottom:14},
  errorText:{color:C.danger,fontSize:13,fontWeight:"600"},
  label:{fontSize:11,fontWeight:"800",color:C.navy,marginBottom:8,marginTop:16,textTransform:"uppercase",letterSpacing:1},
  typeGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},
  typeCard:{width:"47%",backgroundColor:C.surface,borderRadius:10,padding:14,borderWidth:1.5,borderColor:C.border,alignItems:"center",elevation:1},
  typeLabel:{fontSize:13,fontWeight:"700",color:C.navy},
  typeCheck:{position:"absolute",top:8,right:8,width:20,height:20,borderRadius:4,alignItems:"center",justifyContent:"center"},
  priorityRow:{flexDirection:"row",gap:10},
  priorityBtn:{flex:1,paddingVertical:10,borderRadius:8,alignItems:"center",borderWidth:1.5,borderColor:C.border,backgroundColor:C.surface},
  priorityText:{fontSize:13,fontWeight:"700",color:C.textMute},
  input:{backgroundColor:C.surface,borderRadius:10,paddingHorizontal:14,paddingVertical:11,fontSize:14,color:C.navy,borderWidth:1.5,borderColor:C.border},
  textarea:{height:120,paddingTop:12},
  noteBox:{backgroundColor:C.warnBg,borderLeftWidth:4,borderLeftColor:C.gold,borderRadius:8,padding:12,marginTop:16},
  noteText:{color:C.warn,fontSize:12,lineHeight:18},
  submitBtn:{backgroundColor:C.navy,borderRadius:10,paddingVertical:15,alignItems:"center",marginTop:22,elevation:5},
  submitText:{color:"#fff",fontSize:14,fontWeight:"800",letterSpacing:2},
  waitBadge:{width:70,height:70,borderRadius:35,backgroundColor:C.navy,borderWidth:3,borderColor:C.gold,alignItems:"center",justifyContent:"center",marginBottom:16},
  waitBadgeText:{fontSize:28,color:C.gold,fontWeight:"900"},
  waitOrg:{fontSize:10,fontWeight:"900",color:C.textMute,letterSpacing:2,textTransform:"uppercase",marginBottom:6},
  waitTitle:{fontSize:22,fontWeight:"900",color:C.navy,marginBottom:6},
  waitSub:{fontSize:13,color:C.textMute,textAlign:"center",lineHeight:20,marginBottom:20},
  waitCard:{width:"100%",backgroundColor:C.surface,borderRadius:12,padding:16,borderWidth:1,borderColor:C.border,marginBottom:20},
  waitCardTitle:{fontSize:11,fontWeight:"800",color:C.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:12},
  stepRow:{flexDirection:"row",alignItems:"center",gap:12,marginBottom:10},
  stepNum:{width:26,height:26,borderRadius:13,backgroundColor:C.bg,borderWidth:1.5,borderColor:C.border,alignItems:"center",justifyContent:"center"},
  stepNumActive:{backgroundColor:C.navy,borderColor:C.navy},
  stepNumText:{fontSize:11,fontWeight:"800",color:C.textMute},
  stepNumTextActive:{color:C.gold},
  stepLabel:{fontSize:13,color:C.textMute,flex:1},
  stepLabelActive:{color:C.navy,fontWeight:"700"},
  newBtn:{width:"100%",backgroundColor:C.navy,borderRadius:10,paddingVertical:14,alignItems:"center",marginBottom:10,elevation:4},
  newBtnText:{color:"#fff",fontSize:13,fontWeight:"800",letterSpacing:1.5},
  homeBtn:{width:"100%",borderRadius:10,paddingVertical:14,alignItems:"center",borderWidth:1.5,borderColor:C.border,backgroundColor:C.surface},
  homeBtnText:{color:C.navy,fontSize:13,fontWeight:"800",letterSpacing:1.5},
});