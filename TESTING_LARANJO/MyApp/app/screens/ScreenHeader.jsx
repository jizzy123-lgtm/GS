import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const C = {
  navy: "#0B1F3A",
  gold: "#C9A84C",
};

export default function ScreenHeader({ title, subtitle, onBack, backLabel = "← Back", rightAction }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>
      <View style={styles.goldBar} />
      <View style={styles.inner}>
        <View style={styles.row}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backText}>{backLabel}</Text>
            </TouchableOpacity>
          )}
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.rightBtn} activeOpacity={0.8}>
              <Text style={styles.rightText}>{rightAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:      { backgroundColor: C.navy },
  goldBar:   { height: 4, backgroundColor: C.gold },
  inner:     { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  row:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  backBtn:   { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  backText:  { color: "#8A9FC0", fontSize: 13, fontWeight: "700" },
  rightBtn:  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  rightText: { color: "#C9A84C", fontSize: 13, fontWeight: "700" },
  title:     { color: "#fff", fontSize: 20, fontWeight: "800" },
  subtitle:  { color: "#6A85A8", fontSize: 12, marginTop: 3 },
});