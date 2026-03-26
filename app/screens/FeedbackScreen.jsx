import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import ScreenHeader from "./ScreenHeader";

const API_URL = "https://manageit-test-api.coeofjrmsu.com/api";
const C={navy:"#0B1F3A",steel:"#1E4D8C",gold:"#C9A84C",bg:"#F0F2F5",surface:"#FFFFFF",border:"#DDE3EC",textMute:"#8A9BB0",danger:"#9B1C1C",dangerBg:"#FEE8E8",success:"#1A7A4A",successBg:"#EAF6EF",warn:"#B45C10",warnBg:"#FEF3E2",info:"#155E8A",infoBg:"#E6F2FA"};
const RATINGS=[{value:1,emoji:"😞",label:"Poor"},{value:2,emoji:"😕",label:"Fair"},{value:3,emoji:"😐",label:"Okay"},{value:4,emoji:"😊",label:"Good"},{value:5,emoji:"🤩",label:"Excellent"}];

export default function FeedbackScreen({ onBack, requestId, user }) {
  const [completedRequests,setCompletedRequests]=useState([]);
  const [selectedRequest,setSelectedRequest]=useState(requestId||null);
  const [rating,setRating]=useState(0);
  const [comment,setComment]=useState("");
  const [loading,setLoading]=useState(false);
  const [fetchingRequests,setFetchingRequests]=useState(!requestId);
  const [submitted,setSubmitted]=useState(false);

  useEffect(()=>{if(!requestId)fetchCompleted();},[]);

  const fetchCompleted=async()=>{
    try{
      const token=await AsyncStorage.getItem("token");
      const res=await fetch(`${API_URL}/requests`,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
      const data=await res.json();
      const list=Array.isArray(data)?data:data.data||[];
      setCompletedRequests(list.filter(r=>r.status?.toLowerCase()==="completed"&&!r.has_feedback));
    }catch(e){setCompletedRequests([]);}
    finally{setFetchingRequests(false);}
  };

  const handleSubmit=async()=>{
    if(!selectedRequest){Alert.alert("Error","Please select a request.");return;}
    if(rating===0){Alert.alert("Error","Please select a rating.");return;}
    if(!comment.trim()){Alert.alert("Error","Please write a comment.");return;}
    setLoading(true);
    try{
      const token=await AsyncStorage.getItem("token");
      const res=await fetch(`${API_URL}/feedback`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({request_id:selectedRequest,rating,comment}),
      });
      const data=await res.json();
      if(res.ok) setSubmitted(true);
      else Alert.alert("Error",data.message||"Failed to submit.");
    }catch(e){Alert.alert("Error","Cannot connect to server.");}
    finally{setLoading(false);}
  };

  if(submitted) return(
    <View style={styles.successScreen}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>Thank You!</Text>
      <Text style={styles.successSub}>Your feedback helps us improve our services.</Text>
      <TouchableOpacity style={styles.doneBtn} onPress={onBack} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>DONE</Text>
      </TouchableOpacity>
    </View>
  );

  return(
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":"height"}>
      <ScreenHeader title="Feedback" subtitle="Rate the service you received" onBack={onBack}/>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>

          {!requestId&&(
            <>
              <Text style={styles.label}>Select Completed Request *</Text>
              {fetchingRequests?<ActivityIndicator color={C.navy} style={{marginVertical:16}}/>
              :completedRequests.length===0?<View style={styles.emptyBox}><Text style={styles.emptyText}>No completed requests available.</Text></View>
              :completedRequests.map(req=>(
                <TouchableOpacity key={req.id} style={[styles.reqOption,selectedRequest===req.id&&styles.reqOptionActive]} onPress={()=>setSelectedRequest(req.id)} activeOpacity={0.8}>
                  <View style={{flex:1}}>
                    <Text style={styles.reqType}>{req.maintenance_type||req.type}</Text>
                    <Text style={styles.reqDate}>{req.created_at?.slice(0,10)}</Text>
                  </View>
                  {selectedRequest===req.id&&<View style={styles.check}><Text style={{color:"#fff",fontSize:12}}>✓</Text></View>}
                </TouchableOpacity>
              ))}
            </>
          )}

          <Text style={styles.label}>Overall Rating *</Text>
          <View style={styles.ratingRow}>
            {RATINGS.map(r=>(
              <TouchableOpacity key={r.value} style={[styles.ratingBtn,rating===r.value&&styles.ratingBtnActive]} onPress={()=>setRating(r.value)} activeOpacity={0.8}>
                <Text style={styles.ratingEmoji}>{r.emoji}</Text>
                <Text style={[styles.ratingLabel,rating===r.value&&{color:C.navy,fontWeight:"800"}]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating>0&&(
            <View style={styles.ratingDisplay}>
              <Text style={styles.ratingDisplayText}>{RATINGS[rating-1].emoji}  Rated: <Text style={{fontWeight:"800",color:C.navy}}>{RATINGS[rating-1].label}</Text></Text>
            </View>
          )}

          <Text style={styles.label}>Comments / Suggestions *</Text>
          <TextInput style={[styles.input,styles.textarea]} placeholder="Share your experience..." placeholderTextColor="#a0aec0" value={comment} onChangeText={setComment} multiline numberOfLines={5} textAlignVertical="top"/>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>📝 Feedback is mandatory after service completion.</Text>
          </View>

          <TouchableOpacity style={[styles.submitBtn,loading&&{opacity:0.7}]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.submitText}>SUBMIT FEEDBACK →</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},scroll:{paddingBottom:40},
  body:{padding:18},
  label:{fontSize:11,fontWeight:"800",color:C.navy,marginBottom:8,marginTop:16,textTransform:"uppercase",letterSpacing:0.8},
  reqOption:{flexDirection:"row",alignItems:"center",backgroundColor:C.surface,borderRadius:12,padding:14,marginBottom:8,borderWidth:1.5,borderColor:C.border,elevation:1},
  reqOptionActive:{borderColor:C.navy,backgroundColor:"#f0f4ff"},
  reqType:{fontSize:14,fontWeight:"700",color:C.navy},
  reqDate:{fontSize:11,color:C.textMute,marginTop:2},
  check:{width:24,height:24,borderRadius:12,backgroundColor:C.navy,alignItems:"center",justifyContent:"center"},
  ratingRow:{flexDirection:"row",justifyContent:"space-between",gap:6},
  ratingBtn:{flex:1,backgroundColor:C.surface,borderRadius:12,padding:10,alignItems:"center",borderWidth:1.5,borderColor:C.border,elevation:1},
  ratingBtnActive:{borderColor:C.navy,backgroundColor:"#f0f4ff"},
  ratingEmoji:{fontSize:22,marginBottom:3},
  ratingLabel:{fontSize:9,color:C.textMute,fontWeight:"600"},
  ratingDisplay:{backgroundColor:"#f0f4ff",borderRadius:10,padding:12,marginTop:8,borderLeftWidth:4,borderLeftColor:C.navy},
  ratingDisplayText:{fontSize:13,color:"#475569"},
  input:{backgroundColor:C.surface,borderRadius:10,paddingHorizontal:14,paddingVertical:11,fontSize:14,color:C.navy,borderWidth:1.5,borderColor:C.border},
  textarea:{height:120,paddingTop:12},
  noteBox:{backgroundColor:C.warnBg,borderLeftWidth:4,borderLeftColor:C.gold,borderRadius:8,padding:12,marginTop:14},
  noteText:{color:C.warn,fontSize:12,lineHeight:18},
  submitBtn:{backgroundColor:C.steel,borderRadius:10,paddingVertical:15,alignItems:"center",marginTop:20,elevation:5},
  submitText:{color:"#fff",fontSize:14,fontWeight:"800",letterSpacing:2},
  emptyBox:{backgroundColor:C.surface,borderRadius:12,padding:20,alignItems:"center"},
  emptyText:{color:C.textMute,fontSize:13,textAlign:"center"},
  successScreen:{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center",padding:40},
  successIcon:{fontSize:64,marginBottom:16},
  successTitle:{fontSize:28,fontWeight:"800",color:C.navy,marginBottom:6},
  successSub:{fontSize:14,color:C.textMute,textAlign:"center",marginBottom:36,lineHeight:22},
  doneBtn:{backgroundColor:C.navy,borderRadius:14,paddingVertical:15,paddingHorizontal:48,elevation:5},
  doneBtnText:{color:"#fff",fontSize:14,fontWeight:"800",letterSpacing:2},
});