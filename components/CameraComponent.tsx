import { CameraView, CameraType, useCameraPermissions, takePictureAsync } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { AVPlaybackStatusSuccess, Audio } from 'expo-av'

export function CameraComponent() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraVisible, setIsCameraVisible] = useState(false);
    const cameraRef = useRef(null);
    const [loading, setLoading] = useState(false);

    

    if (!permission) {
      // Camera permissions are still loading.
      return <View />;
    }
  
    if (!permission.granted) {
      // Camera permissions are not granted yet.
      return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to show the camera</Text>
          <Button onPress={requestPermission} title="grant permission" />
        </View>
      );
    }
  
    function toggleCameraFacing() {
      setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    async function takePicture() {
        if (cameraRef.current) {
            try {
                console.log("Image taken")
                const photo = await cameraRef.current.takePictureAsync();
                setIsCameraVisible(false);
                setLoading(true);
                const base64Data = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });
                const text = await extractTextFromImage(base64Data)
                await textToSpeech(text)
                //console.log(text)
                setLoading(false);
            } catch (error) {
                console.log(error)
            }

        }
     };
   
    // Function to extract text from an image
    async function extractTextFromImage(imageBase64) {
        try {
            console.log('Extracting text from Image');
            let url = "https://vision.googleapis.com/v1/images:annotate?key=" + "AIzaSyAIvUp0WRaBDGAD6aMaXqqW4QDYzbyPbX0"

            const requestData = {
                requests: [
                  {
                    image: {
                      content: imageBase64,
                    },
                    features: [{ type: 'TEXT_DETECTION' }],
                  },
                ],
              };
        
            const apiResponse = await axios.post(url, requestData);
            console.log('Finished extracting text from Image');
            return apiResponse.data.responses[0].fullTextAnnotation.text;
        } catch (error) {
            console.error("Error during text extraction:", error);
        }
    }

    async function textToSpeech(textToSpeak, outputPath = "output.mp3", chunkSize = 1024) {
        console.log("Text to speech loading")
        try {
        const apiKey = 'sk_2d846c058728854fbb35d8c7fe42704858f1c6ccb938f914';
        const voiceId = 'pNInz6obpgDQGcFmaJgB';
        const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const headers = {
            "Accept": "application/json",
            "xi-api-key": apiKey
        };
        const data = {
            "text": textToSpeak,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "style": 0.0,
                "use_speaker_boost": true
            }
        };

        const voiceSettings = {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.0,
            "use_speaker_boost": true
        }

        const historyUrl = `https://api.elevenlabs.io/v1/history`;
        const historyBody = {
            voice_id: voiceId,
            page_size: 1,
            headers: headers
        }
        //const response = await axios.get(historyUrl, historyBody);
        //console.log(response.data)
             const response = await axios.post(ttsUrl, data, { headers });
            
            if (response.status === 200) {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted === true) {
                    console.log('Permission Granted', permissions.directoryUri);
                    const uri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, "temporary.mp3", "audio")
                    const {sound} = await Audio.Sound.createAsync({ uri: uri });
                    await sound.playAsync();
                    console.log('Playing Sound');
                } else {
                    console.log('Permission Denied');
                }
                //const { sound } = await Audio.Sound.createAsync({ source: response.data})
                
                /* await FileSystem.writeAsStringAsync("file://output.mp3", response.data, { encoding: FileSystem.EncodingType.Base64 })
                // Don't forget to clean the cache when you're done playing the file, it is not done automatically
                ReactNativeBlobUtil.fs.unlink(path)
                console.log('Loading Sound');
                await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
                const { sound } = await Audio.Sound.("output.mp3") */
                
                
            } else {
                console.error(`Error: ${response.status}, ${response.data}`);
            }
            console.log("Text to speech finished loading")
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
  
    return (
      <View style={styles.container}>
        {
            loading ? (
                <Text style={styles.text}>Loading...</Text>
            ) : isCameraVisible ? (
                <View style={styles.containerCamera}>
                    <CameraView style={styles.camera} facing={facing} ref={cameraRef} >
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={() => setIsCameraVisible(false)}>
                            <Text style={styles.text}>Hide</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={takePicture}>
                            <Text style={styles.text}>Take</Text>
                        </TouchableOpacity>
                    </View>
                    </CameraView>
                </View>
            ) : (
                <Button onPress={() => setIsCameraVisible(true)} title="Show Camera" />
            )
        }
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  containerCamera: {
    flex: 1,
    width: '100%',
    height: '100%',
    //position: 'absolute',
    zIndex: 1
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
    padding: 20,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default CameraComponent;