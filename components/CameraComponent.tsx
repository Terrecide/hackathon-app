import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { TabBarIcon } from './navigation/TabBarIcon';
import OpenAI from 'openai';

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
                speakExtraQuestions(textToSpeak);
            }
        }),
        console.log("Text to speech finished")
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }

    async function speakExtraQuestions(textToSpeak: any) {
        try {
          const client = new OpenAI({
            apiKey: '', // This is the default and can be omitted
          });
          const prompt = 'You are a literature teacher for 12th-grade students in Bulgaria. Based on the following text, create a question that checks the students understanding of the material and whether they are prepared for the final exam:' + textToSpeak + '. Just return the questions directly.';
          const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'gpt-4-turbo',
          });
   
          const generatedQuestion = chatCompletion.choices[0].message.content;
          console.log(generatedQuestion);
   
          Speech.speak(generatedQuestion!, {
            language: 'en',
            pitch: 1,
            rate: 0.75,
            onDone: () => {
              setAvatarTalking(false);
            }
          });
        } catch (error) {
          console.error('Error generating question:', error);
        }
    }

    function speakStop() {
      Speech.stop();
    }
  
    return (
      <View style={styles.container}>
        {
            loading ? (
                <Text style={styles.text}>
                  <TabBarIcon name={'refresh'} color={"white"} />
                </Text>
            ) : avatarTalking ? (
              <View style={styles.containerMain}>
                <Text style={styles.text}>Avatar is talking...</Text>
                <TouchableOpacity style={styles.button} onPress={speakStop}>
                  <TabBarIcon name={'pause'} color={"white"} />
                </TouchableOpacity>
              </View>

            ) : isCameraVisible ? (
                <View style={styles.containerCamera}>
                    <CameraView style={styles.camera} facing={facing} ref={cameraRef} >

                    </CameraView>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={() => setIsCameraVisible(false)}>
                          <TabBarIcon name={'close'} color={"white"} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={takePicture}>
                          <TabBarIcon name={'camera'} color={"white"} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.containerMain}>
                    <Text style={styles.text}>Hello, I'm your learning assistant.{"\n"}{"\n"}Take a photo of your study book to continue:</Text>
                    <TouchableOpacity style={styles.button} onPress={() => setIsCameraVisible(true)}>
                      <TabBarIcon name={'camera'} color={"white"} />
                    </TouchableOpacity>
                </View>
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
    paddingTop: 100,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  containerCamera: {
    flex: 1,
    flexGrow: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 1
  },
  containerMain: {
    flex: 1,
    flexGrow: 1,
    gap: 15,
    padding: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    height: '100%',
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: 'black',
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 50,
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default CameraComponent;