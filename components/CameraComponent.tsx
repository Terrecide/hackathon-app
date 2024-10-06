import { CameraView, CameraType, useCameraPermissions, takePictureAsync } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import * as Speech from 'expo-speech';

export function CameraComponent() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraVisible, setIsCameraVisible] = useState(false);
    const cameraRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [avatarTalking, setAvatarTalking] = useState(false);

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

    async function takePicture() {
        if (cameraRef.current) {
            try {
                console.log("Image taken")
                const photo = await cameraRef.current.takePictureAsync();
                setIsCameraVisible(false);
                setLoading(true);
                const base64Data = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });
                const text = await extractTextFromImage(base64Data)
                setLoading(false);
                textToSpeech(text);

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

    function textToSpeech(textToSpeak: string) {
        try {
        console.log("Text to speech: ", textToSpeak)
        setAvatarTalking(true);
        Speech.speak(textToSpeak, {
            language: 'en',
            pitch: 1,
            rate: 0.75,
            onDone: () => {
                speakExtraQuestions();
            }
        }),
        console.log("Text to speech finished")
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }

    function speakExtraQuestions() {
        //TODO: call GPT and get extra questions and speak them on done stop speaking
        setAvatarTalking(false);
    }
  
    return (
      <View style={styles.container}>
        {
            loading ? (
                <Text style={styles.text}>Loading...</Text>
            ) : avatarTalking ? (
                <Text style={styles.text}>Avatar is talking...</Text>
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