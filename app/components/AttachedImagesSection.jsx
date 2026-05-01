import { useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { normalizeImageUrls } from "../../utils/imageAttachments";

const C = {
  navy: "#0B1F3A",
  steel: "#1E4D8C",
  bg: "#F0F2F5",
  surface: "#FFFFFF",
  border: "#DDE3EC",
  textMute: "#8A9BB0",
};

export default function AttachedImagesSection({ imageUrls, title = "Attached Images" }) {
  const [previewIndex, setPreviewIndex] = useState(-1);
  const safeUrls = useMemo(() => normalizeImageUrls(imageUrls), [imageUrls]);

  if (safeUrls.length === 0) return null;

  const previewUrl = safeUrls[previewIndex] || "";

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {safeUrls.map((url, index) => (
          <TouchableOpacity key={`${url}-${index}`} style={styles.thumbBtn} onPress={() => setPreviewIndex(index)} activeOpacity={0.85}>
            <Image source={{ uri: url }} style={styles.thumb} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={previewIndex >= 0}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewIndex(-1)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Image source={{ uri: previewUrl }} style={styles.fullImage} resizeMode="contain" />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setPreviewIndex(-1)}>
                <Text style={styles.actionText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.primaryBtn]}
                onPress={() => previewUrl && Linking.openURL(previewUrl)}
              >
                <Text style={[styles.actionText, styles.primaryText]}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMute,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  row: {
    gap: 8,
    paddingRight: 4,
  },
  thumbBtn: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  thumb: {
    width: 84,
    height: 84,
    backgroundColor: C.bg,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  fullImage: {
    width: "100%",
    height: 360,
    backgroundColor: "#000",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.navy,
  },
  primaryBtn: {
    backgroundColor: C.steel,
    borderColor: C.steel,
  },
  primaryText: {
    color: "#fff",
  },
});

