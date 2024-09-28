import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Voice from '@react-native-voice/voice';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import SendIntentAndroid from 'react-native-send-intent';
import Tts from 'react-native-tts';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const fetchLastReminder = async () => {
      try {
        const storedReminders = await AsyncStorage.getItem('reminders');
        if (storedReminders) {
          setReminders(JSON.parse(storedReminders));
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
      }
    };

    fetchLastReminder();

    const startListening = async () => {
      try {
        await Tts.speak('What is the date?');
        await Voice.start('en-US');
      } catch (e) {
        console.error(e);
      }
    };

    const onSpeechResults = async (event) => {
      const spokenText = event.value[0];
      console.log('Spoken text:', spokenText);

      const eventDate = moment(spokenText, 'YYYY-MM-DD', true); // Specify strict parsing
      if (!eventDate.isValid()) {
        console.error('Invalid date format');
        return;
      }

      const newReminder = {
        id: reminders.length + 1,
        reminderName: 'New Reminder',
        time: '12am', // Change as needed
        date: spokenText
      };

      setReminders([...reminders, newReminder]);

      PushNotification.localNotification({
        message: `New event on ${spokenText} added to calendar`,
        soundName: Platform.OS === 'android' ? 'default' : 'default.mp3',
        channelId: 'test-channel',
      });

      const formattedDate = eventDate.toISOString();

      // Save reminders to AsyncStorage
      await AsyncStorage.setItem('reminders', JSON.stringify([...reminders, newReminder]));

      SendIntentAndroid.addCalendarEvent({
        title: 'New Reminder',
        description: `New Reminder on ${spokenText}`,
        startDate: formattedDate,
        endDate: formattedDate,
        recurrence: 'does not repeat',
      })
        .then((event) => {
          console.log('Event added to calendar:', event);
        })
        .catch((error) => {
          console.error('Error adding event to calendar:', error);
        });
    };

    const onDeleteCommand = () => {
      // Handle voice command to delete reminder here
      console.log('Delete command received');
      // Implement your logic to delete reminders based on voice command
    };

    Voice.onSpeechResults = onSpeechResults;
    // Voice.onSpeechPartialResults = onSpeechPartialResults;

    startListening();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // const onSpeechPartialResults = (event) => {
  //   // Handle partial speech results here if needed
  // };

  return (
    <LinearGradient style={styles.container}
      colors={['#6242E3', '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.1, y: 0.8 }}
      useAngle={false}
    >
      <Image
        source={require('./calender-removebg-preview.png')}
        style={{
          height: 220,
          width: 220,
          alignSelf: 'center',
          marginTop: 50,
          transform: [{rotate: '-10deg'}]
        }}
      />
      {
        reminders.map((item, index) => (
          <View key={index} style={{
            justifyContent: 'space-between',
            flexDirection: 'column',
            margin: 10
          }}>
            <LinearGradient
              colors={['#6645EB', '#372481']}
              style={{
                width: 370,
                height: 100,
                alignSelf: 'center',
                borderRadius: 20
              }}
            >
              <View style={{
                alignItems: 'center',
                justifyContent: 'space-around',
                flexDirection: 'row',
              }}>
                <Text style={{
                  fontSize: 23,
                  color: '#fff',
                  justifyContent: 'center',
                  marginBottom: 15
                }}>{item.reminderName}</Text>
                <Text style={{
                  fontSize: 23,
                  color: '#fff',
                  justifyContent: 'center',
                  marginBottom: 15
                }}>{item.time}</Text>
              </View>
              <View style={{
                width: '100%',
                height: 1,
                backgroundColor: '#372481',
                alignSelf: 'center',
              }}></View>
              <View style={{
                justifyContent: 'center',
                flexDirection: 'row'
              }}>
                <Image
                  source={require('./calender_icon-removebg-preview.png')}
                  style={{ height: 50, width: 50, alignSelf: 'center' }}
                />
                <Text style={{
                  fontSize: 23,
                  color: '#fff',
                  alignSelf: 'center'
                }}>{item.date}</Text>
              </View>
            </LinearGradient>
          </View>
        ))
      }
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  }
});

export default Reminders;
