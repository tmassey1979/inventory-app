import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  photoUri: string | null;
  onPhotoSelected: (uri: string) => void;
  onPhotoRemoved: () => void;
  size?: number;
}

export function PhotoPicker({
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
  size = 200,
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Needed',
        'Please allow camera access in Settings to take photos of inventory items. You can still save items without a photo.'
      );
      return false;
    }
    return true;
  };

  const requestLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Needed',
        'Please allow photo library access in Settings to select photos. You can still save items without a photo.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const ok = await requestCameraPermission();
    if (!ok) return;
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera.');
    } finally {
      setLoading(false);
    }
  };

  const chooseFromGallery = async () => {
    const ok = await requestLibraryPermission();
    if (!ok) return;
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library.');
    } finally {
      setLoading(false);
    }
  };

  const showOptions = () => {
    if (Platform.OS === 'ios') {
      const options = photoUri
        ? ['Take Photo', 'Choose From Gallery', 'Remove Photo', 'Cancel']
        : ['Take Photo', 'Choose From Gallery', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: photoUri ? 2 : undefined,
        },
        (index) => {
          if (index === 0) takePhoto();
          else if (index === 1) chooseFromGallery();
          else if (photoUri && index === 2) onPhotoRemoved();
        }
      );
    } else {
      const buttons: {
        text: string;
        onPress?: () => void;
        style?: 'cancel' | 'destructive';
      }[] = [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose From Gallery', onPress: chooseFromGallery },
      ];
      if (photoUri) {
        buttons.push({
          text: 'Remove Photo',
          onPress: onPhotoRemoved,
          style: 'destructive',
        });
      }
      buttons.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert('Photo', 'Select an option', buttons);
    }
  };

  return (
    <TouchableOpacity
      onPress={showOptions}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: isDark ? '#1e1e2e' : '#F3F4F6',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        },
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : photoUri ? (
        <>
          <Image source={{ uri: photoUri }} style={styles.image} />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Tap to change</Text>
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text
            style={[
              styles.placeholderText,
              { color: isDark ? '#9CA3AF' : '#6B7280' },
            ]}
          >
            Add Photo
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  overlayText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  placeholder: { alignItems: 'center' },
  cameraIcon: { fontSize: 40, marginBottom: 8 },
  placeholderText: { fontSize: 15, fontWeight: '600' },
});
