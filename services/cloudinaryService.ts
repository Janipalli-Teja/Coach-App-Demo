import * as ImagePicker from 'expo-image-picker';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Upload an image to Cloudinary
 * @param imageUri - Local URI of the image from ImagePicker
 * @param folder - Optional folder name in Cloudinary (e.g., 'students/aadhaar')
 * @returns Promise with upload result
 */
export const uploadImageToCloudinary = async (
    imageUri: string,
    folder: string = 'students'
): Promise<UploadResult> => {
    try {
        // Create form data
        const formData = new FormData();

        // Extract file info from URI
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const fileType = filename.split('.').pop() || 'jpg';

        // @ts-ignore - FormData typing issue with React Native
        formData.append('file', {
            uri: imageUri,
            type: `image/${fileType}`,
            name: filename,
        });

        if (!CLOUDINARY_UPLOAD_PRESET) {
            return {
                success: false,
                error: 'Cloudinary upload preset is not configured',
            };
        }

        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', folder);

        // Upload to Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        const data = await response.json();

        if (response.ok && data.secure_url) {
            return {
                success: true,
                url: data.secure_url,
            };
        } else {
            return {
                success: false,
                error: data.error?.message || 'Upload failed',
            };
        }
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

/**
 * Pick an image from gallery or camera and upload to Cloudinary
 * @param source - 'camera' or 'gallery'
 * @param folder - Optional Cloudinary folder
 * @returns Promise with upload result
 */
export const pickAndUploadImage = async (
    source: 'camera' | 'gallery' = 'gallery',
    folder: string = 'students'
): Promise<UploadResult> => {
    try {
        // Request permissions
        if (source === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                return {
                    success: false,
                    error: 'Camera permission denied',
                };
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                return {
                    success: false,
                    error: 'Gallery permission denied',
                };
            }
        }

        // Pick image
        const result = source === 'camera'
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

        if (result.canceled) {
            return {
                success: false,
                error: 'Image selection cancelled',
            };
        }

        // Upload to Cloudinary
        return await uploadImageToCloudinary(result.assets[0].uri, folder);
    } catch (error) {
        console.error('Image picker error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to pick image',
        };
    }
};

/**
 * Delete an image from Cloudinary (requires backend endpoint for security)
 * Note: Direct deletion from mobile apps is not recommended for security reasons.
 * You should implement this on your backend with admin API credentials.
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
    console.warn('Delete operation should be handled by backend for security');
    // Implement backend endpoint: POST /api/cloudinary/delete
    // Pass publicId and use Cloudinary Admin API on server
    return false;
};
