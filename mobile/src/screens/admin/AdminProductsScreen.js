import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, Modal, ScrollView, Alert, ActivityIndicator, RefreshControl
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useTheme } from "../../hooks/useTheme";
import { uploadImageToCloudinary } from "../../services/cloudinaryService";
import ScreenHeader from "../../components/ScreenHeader";

const CATEGORIES = ["All", "Purifier", "Dispenser", "Pump", "Filter", "Spare"];

export default function AdminProductsScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Purifier");
  const [formPrice, setFormPrice] = useState("");
  const [formWholesalePrice, setFormWholesalePrice] = useState("");
  const [formMinQty, setFormMinQty] = useState("5");
  const [formStock, setFormStock] = useState("20");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const handlePickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Needed", "Please allow access to your photos to upload product images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingImage(true);
        const imagePayload = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        const uploadedUrl = await uploadImageToCloudinary(imagePayload, "califnco/products");
        setFormImageUrl(uploadedUrl);
        Alert.alert("Image Uploaded", "Product image successfully uploaded to Cloudinary!");
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      Alert.alert("Upload Failed", err.message || "Failed to upload image to Cloudinary.");
    } finally {
      setUploadingImage(false);
    }
  };

  const loadProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      // Sort alphabetically by name
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setProducts(list);
    } catch (err) {
      console.warn("Error fetching products:", err.message);
      Alert.alert("Error", "Failed to load catalog products: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatch =
        selectedCategory === "All" ||
        (p.category || "").toLowerCase() === selectedCategory.toLowerCase();
      const q = search.trim().toLowerCase();
      const searchMatch =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [products, selectedCategory, search]);

  const openAddModal = () => {
    const generatedId = `prod_custom_${Date.now().toString().slice(-6)}`;
    setFormId(generatedId);
    setFormName("");
    setFormCategory("Purifier");
    setFormPrice("");
    setFormWholesalePrice("");
    setFormMinQty("5");
    setFormStock("20");
    setFormImageUrl("https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80");
    setFormDescription("");
    setIsEditing(false);
    setModalVisible(true);
  };

  const openEditModal = (prod) => {
    setFormId(prod.id);
    setFormName(prod.name || "");
    setFormCategory(prod.category || "Purifier");
    setFormPrice(String(prod.price || ""));
    setFormWholesalePrice(
      prod.wholesalePrice ? String(prod.wholesalePrice) : String(Math.round((Number(prod.price) || 0) * 0.7))
    );
    setFormMinQty(String(prod.minQty || "5"));
    setFormStock(String(prod.stock ?? "20"));
    setFormImageUrl(prod.imageUrl || "");
    setFormDescription(prod.description || "");
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert("Validation", "Please enter a product name.");
      return;
    }
    const priceNum = Number(formPrice);
    if (!priceNum || priceNum <= 0) {
      Alert.alert("Validation", "Please enter a valid retail price.");
      return;
    }

    setSaving(true);
    try {
      const stockNum = Number(formStock) || 0;
      const wholesaleNum = formWholesalePrice ? Number(formWholesalePrice) : Math.round(priceNum * 0.7);
      const minQtyNum = Number(formMinQty) || 5;

      const productPayload = {
        id: formId,
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        stock: stockNum,
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim() || "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80",
        rating: 4.8,
        reviewCount: 12,
        updatedAt: serverTimestamp()
      };

      if (!isEditing) {
        productPayload.createdAt = serverTimestamp();
      }

      // Write to products/{id}
      await setDoc(doc(db, "products", formId), productPayload, { merge: true });

      // Sync wholesale/{id}
      await setDoc(doc(db, "wholesale", formId), {
        productId: formId,
        productName: formName.trim(),
        category: formCategory,
        price: wholesaleNum,
        minQty: minQtyNum,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setModalVisible(false);
      Alert.alert("Success", isEditing ? "Product updated successfully!" : "New product published to catalog!");
      loadProducts();
    } catch (err) {
      Alert.alert("Error", "Failed to save product: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (prod) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to permanently delete "${prod.name}" (${prod.id}) from the catalog?\n\nThis will remove it from both retail and wholesale stores.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "products", prod.id));
              try {
                await deleteDoc(doc(db, "wholesale", prod.id));
              } catch (e) {}
              setModalVisible(false);
              Alert.alert("Deleted", `"${prod.name}" was removed from the catalog.`);
              loadProducts();
            } catch (err) {
              Alert.alert("Error", "Failed to delete product: " + err.message);
            }
          }
        }
      ]
    );
  };

  const handleStockAdjust = async (prod, delta) => {
    const currentStock = Number(prod.stock) || 0;
    const newStock = Math.max(0, currentStock + delta);
    try {
      await updateDoc(doc(db, "products", prod.id), {
        stock: newStock
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, stock: newStock } : p))
      );
    } catch (err) {
      Alert.alert("Error", "Failed to update stock: " + err.message);
    }
  };

  const renderProductItem = ({ item }) => {
    const stock = Number(item.stock) || 0;
    const isOut = stock <= 0;
    const isLow = stock > 0 && stock < 10;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=200" }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.cardInfo}>
            <View style={styles.categoryBadgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }]}>
                <Text style={[styles.categoryBadgeText, { color: theme.textMuted }]}>{item.category || "Purifier"}</Text>
              </View>
              <View
                style={[
                  styles.stockBadge,
                  isOut ? styles.stockOut : isLow ? styles.stockLow : styles.stockGood
                ]}
              >
                <Text style={styles.stockBadgeText}>
                  {isOut ? "Out of Stock" : isLow ? `Low Stock (${stock})` : `In Stock (${stock})`}
                </Text>
              </View>
            </View>

            <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.skuText, { color: theme.textMuted }]}>SKU: {item.id}</Text>

            <View style={styles.priceRow}>
              <Text style={[styles.priceRetail, { color: isDark ? theme.accent : theme.primary }]}>
                Rs. {Number(item.price || 0).toLocaleString("en-IN")}
              </Text>
              {item.wholesalePrice && (
                <Text style={[styles.priceWholesale, { color: theme.textMuted }]}>
                  B2B: Rs. {Number(item.wholesalePrice).toLocaleString("en-IN")}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stock Quick Adjustment & Action Buttons */}
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.stockCounter}>
            <Text style={[styles.stockLabel, { color: theme.textMuted }]}>Stock:</Text>
            <TouchableOpacity
              style={[styles.counterBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" }]}
              onPress={() => handleStockAdjust(item, -1)}
            >
              <MaterialIcons name="remove" size={16} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.counterValue, { color: theme.text }]}>{stock}</Text>
            <TouchableOpacity
              style={[styles.counterBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" }]}
              onPress={() => handleStockAdjust(item, 1)}
            >
              <MaterialIcons name="add" size={16} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: isDark ? "rgba(14, 165, 233, 0.15)" : "#e0f2fe" }]}
              onPress={() => openEditModal(item)}
            >
              <MaterialIcons name="edit" size={16} color="#0284c7" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2" }]}
              onPress={() => handleDelete(item)}
            >
              <MaterialIcons name="delete-outline" size={16} color="#dc2626" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Unified Screen Header */}
      <ScreenHeader
        title="Catalog & Inventory"
        subtitle={`${products.length} products listed • Live stock control`}
        badgeText="👑 ADMIN CATALOG"
        badgeIcon="inventory"
        rightAction={
          <TouchableOpacity style={styles.headerAddBtn} onPress={openAddModal} activeOpacity={0.8}>
            <MaterialIcons name="add" size={18} color="#ffffff" />
            <Text style={styles.headerAddBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <MaterialIcons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search products by name or SKU..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips Bar */}
      <View style={{ backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  active && { backgroundColor: isDark ? theme.accent : theme.primary }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    active ? { color: active && !isDark ? "#ffffff" : "#042f2e", fontWeight: "700" } : { color: theme.textMuted }
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading Catalog Items...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerBox}>
          <MaterialIcons name="inventory-2" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Products Found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            No catalog products match "{search}".
          </Text>
          <TouchableOpacity style={[styles.resetBtn, { backgroundColor: theme.primary }]} onPress={() => { setSearch(""); setSelectedCategory("All"); }}>
            <Text style={{ color: "#ffffff", fontWeight: "700" }}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        />
      )}

      {/* Add / Edit Product Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? "Edit Product Specifications" : "Create New Catalog Product"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Product Name *</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Califnco Titan 10-Stage RO Purifier"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.formLabel, { color: theme.text, marginTop: 12 }]}>Category</Text>
              <View style={styles.formCategoryRow}>
                {["Purifier", "Dispenser", "Pump", "Filter", "Spare"].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.formCategoryChip,
                      formCategory === c && { backgroundColor: isDark ? theme.accent : theme.primary }
                    ]}
                    onPress={() => setFormCategory(c)}
                  >
                    <Text
                      style={[
                        styles.formCategoryText,
                        formCategory === c ? { color: "#ffffff", fontWeight: "700" } : { color: theme.textMuted }
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.gridRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.formLabel, { color: theme.text, marginTop: 12 }]}>Retail Price (Rs.) *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}
                    value={formPrice}
                    onChangeText={setFormPrice}
                    keyboardType="numeric"
                    placeholder="24999"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.formLabel, { color: theme.text, marginTop: 12 }]}>Wholesale Price (Rs.)</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}
                    value={formWholesalePrice}
                    onChangeText={setFormWholesalePrice}
                    keyboardType="numeric"
                    placeholder="17499"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.formLabel, { color: theme.text, marginTop: 12 }]}>Initial Stock *</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}
                    value={formStock}
                    onChangeText={setFormStock}
                    keyboardType="numeric"
                    placeholder="25"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.formLabel, { color: theme.text, marginTop: 12 }]}>Min B2B Order Qty</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}
                    value={formMinQty}
                    onChangeText={setFormMinQty}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              {/* Product Image & Cloudinary Upload */}
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={[styles.formLabel, { color: theme.text, marginTop: 0 }]}>Product Image</Text>
                  <TouchableOpacity
                    style={[styles.uploadCloudBtn, uploadingImage && { opacity: 0.6 }]}
                    onPress={handlePickAndUploadImage}
                    disabled={uploadingImage}
                    activeOpacity={0.8}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialIcons name="cloud-upload" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.uploadCloudBtnText}>Upload to Cloudinary</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {formImageUrl ? (
                  <View style={[styles.imagePreviewWrap, { borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}>
                    <Image source={{ uri: formImageUrl }} style={styles.imagePreviewThumb} resizeMode="cover" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <MaterialIcons name="cloud-done" size={14} color="#10b981" />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#10b981", marginLeft: 4 }}>
                          {formImageUrl.includes("cloudinary.com") ? "Cloudinary Hosted" : "Image Attached"}
                        </Text>
                      </View>
                      <Text style={[styles.imagePreviewUrl, { color: theme.textMuted }]} numberOfLines={1}>
                        {formImageUrl}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setFormImageUrl("")}
                      style={{ padding: 6 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="close" size={18} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc", marginTop: 6 }]}
                  value={formImageUrl}
                  onChangeText={setFormImageUrl}
                  placeholder="Or paste image URL (https://...)"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <Text style={[styles.formLabel, { color: theme.text, marginTop: 12 }]}>Specifications & Description</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: "top", color: theme.text, borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
                placeholder="Features, filter life, dimensions..."
                placeholderTextColor={theme.textMuted}
              />

              {/* Form Action Buttons */}
              <View style={styles.formButtonRow}>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.deleteModalBtn}
                    onPress={() => handleDelete({ id: formId, name: formName })}
                  >
                    <MaterialIcons name="delete" size={18} color="#dc2626" />
                    <Text style={styles.deleteModalBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.saveModalBtn, { backgroundColor: isDark ? theme.accent : theme.primary }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={18} color={isDark ? "#042f2e" : "#ffffff"} />
                      <Text style={[styles.saveModalBtnText, { color: isDark ? "#042f2e" : "#ffffff" }]}>
                        {isEditing ? "Save Changes" : "Publish Product"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerBanner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff"
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#00b4d8",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff"
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "transparent"
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600"
  },
  listContent: {
    padding: 12,
    paddingBottom: 40
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden"
  },
  cardHeader: {
    flexDirection: "row",
    padding: 12,
    gap: 12
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e2e8f0"
  },
  cardInfo: {
    flex: 1
  },
  categoryBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600"
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  stockGood: {
    backgroundColor: "rgba(22, 163, 74, 0.15)"
  },
  stockLow: {
    backgroundColor: "rgba(217, 119, 6, 0.15)"
  },
  stockOut: {
    backgroundColor: "rgba(220, 38, 38, 0.15)"
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: "700"
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 2
  },
  skuText: {
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 6
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  priceRetail: {
    fontSize: 15,
    fontWeight: "800"
  },
  priceWholesale: {
    fontSize: 12,
    fontWeight: "600"
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1
  },
  stockCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: "600"
  },
  counterBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  counterValue: {
    fontSize: 13,
    fontWeight: "800",
    minWidth: 24,
    textAlign: "center"
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284c7"
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dc2626"
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16
  },
  resetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: 24
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800"
  },
  formScroll: {
    padding: 16
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14
  },
  formCategoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4
  },
  formCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)"
  },
  formCategoryText: {
    fontSize: 12
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  formButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 20
  },
  deleteModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    marginRight: "auto"
  },
  deleteModalBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#dc2626"
  },
  saveModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8
  },
  saveModalBtnText: {
    fontSize: 14,
    fontWeight: "800"
  },
  uploadCloudBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00b4d8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  uploadCloudBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700"
  },
  imagePreviewWrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8
  },
  imagePreviewThumb: {
    width: 48,
    height: 48,
    borderRadius: 8
  },
  imagePreviewUrl: {
    fontSize: 11
  }
});
